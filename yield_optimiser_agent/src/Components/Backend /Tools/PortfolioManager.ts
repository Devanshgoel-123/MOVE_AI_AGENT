import { tool } from "@langchain/core/tools";
import { z as Zod } from "zod";
import Panora from "@panoraexchange/swap-sdk";
import { panoraConfig } from "@/config/config";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

import { InitializeAgent } from "@/app/api/Agent/route";
import { HumanMessage } from "@langchain/core/messages";
import { 
  fetchTokenPriceInUsd, 
  fetchSupportedTokens, 
  getTokenAmountOwnedByAccount 
} from "../Common/Token";

// Initialize environment and services
dotenv.config();
const prisma = new PrismaClient();
const client = new Panora(panoraConfig);

// Define key types and enums
enum TokenCategory {
  STABLECOIN = "stablecoin",
  NATIVE = "native",
  OTHER = "other"
}

interface TokenInfo {
  symbol: string;
  amount: number;
  value_usd: number;
  category: TokenCategory;
  tokenAddress: string;
  decimals: number;
  price_usd:string;
  chainId:number;
}

interface Portfolio {
  tokens: TokenInfo[];
  total_value_usd: number;
}

interface SwapAction {
  from_token_address: string;
  to_token_address: string;
  amount: number;
  chainId: number;
  fromTokenDecimals:number;
}

interface UserPreference {
  walletAddress: string;
  targetAllocation: Record<TokenCategory, number>;
}

/**
 * Gets the user's current diversification preference from the database
 */
async function getUserDiversificationPreference(walletAddress: string): Promise<UserPreference | null> {
  try {
    // Fetch from database using Prisma
    const preference = await prisma.userPortfolioPreference.findUnique({
      where: { walletAddress }
    });
    
    if (!preference) return null;
    
    return {
      walletAddress: preference.walletAddress,
      targetAllocation: {
        [TokenCategory.STABLECOIN]: preference.StablePercentage,
        [TokenCategory.NATIVE]: preference.NativePercentage,
        [TokenCategory.OTHER]: preference.OtherPercentage
      }
    };
  } catch (error) {
    console.error("Error fetching user preference:", error);
    return null;
  }
}

/**
 * Saves user preference to the database
 */
async function saveUserPreference(
  walletAddress: string, 
  targetAllocation: Record<TokenCategory, number>
): Promise<void> {
  try {
    await prisma.userPortfolioPreference.upsert({
      where: { walletAddress },
      update: {
        StablePercentage: targetAllocation[TokenCategory.STABLECOIN],
        NativePercentage: targetAllocation[TokenCategory.NATIVE],
        OtherPercentage: targetAllocation[TokenCategory.OTHER]
      },
      create: {
        walletAddress,
        StablePercentage: targetAllocation[TokenCategory.STABLECOIN],
        NativePercentage: targetAllocation[TokenCategory.NATIVE],
        OtherPercentage: targetAllocation[TokenCategory.OTHER]
      }
    });
  } catch (error) {
    console.error("Error saving user preference:", error);
    throw new Error(`Failed to save user preference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function fetchUserPortfolio(accountAddress: string): Promise<Portfolio> {
  //console.log("fetching user protfolio")
  const supportedTokens = await fetchSupportedTokens();
  
  //console.log("The supported tokens are:",supportedTokens);
  let totalValueUsd = 0;
  const tokens: TokenInfo[] = [];

  for (const token of supportedTokens) {
    const tokenAmount = await getTokenAmountOwnedByAccount(accountAddress, token.token_address);
    //console.log("token Amount",tokenAmount)
    const tokenPriceUsd = await fetchTokenPriceInUsd(token.token_address);
   // console.log("the token Price in Usd is",tokenPriceUsd)
    const valueUsd = (tokenAmount/(10**token.decimals)) * Number(tokenPriceUsd || 1);
    const category = token.type === "stablecoin" ? TokenCategory.STABLECOIN : 
                     token.type === "native" ? TokenCategory.NATIVE : 
                     TokenCategory.OTHER;
    tokens.push({
      symbol: token.token_address.slice(-5),
      amount: tokenAmount,
      value_usd: valueUsd,
      category: category,
      tokenAddress: token.token_address,
      decimals: token.decimals,
      price_usd:tokenPriceUsd,
      chainId:token.chain_id
    });
    totalValueUsd += valueUsd;
  }

  return {
    tokens,
    total_value_usd: totalValueUsd
  };
}

/**
 * Function to calculate the current diversity of the portfolio
 * @param portfolio 
 * @returns the current diversity of the portfolio
 */
function calculateCurrentAllocation(portfolio: Portfolio): Record<TokenCategory, number> {
  const allocations: Record<TokenCategory, number> = {
    [TokenCategory.STABLECOIN]: 0,
    [TokenCategory.NATIVE]: 0,
    [TokenCategory.OTHER]: 0
  };
  
  const totalValue = portfolio.total_value_usd;
  if (totalValue === 0) return allocations;
  
  for (const token of portfolio.tokens) {
    allocations[token.category] += (token.value_usd / totalValue) * 100;
  }
  
  Object.keys(allocations).forEach(key => {
    allocations[key as TokenCategory] = parseFloat(allocations[key as TokenCategory].toFixed(2));
  });
  console.log("The current allocations are:",allocations)
  return allocations;
}

/**
 * Determines required swaps to rebalance the portfolio according to target allocation
 */
function calculateRequiredSwaps(
  portfolio: Portfolio,
  currentAllocation: Record<TokenCategory, number>,
  targetAllocation: Record<TokenCategory, number>
): SwapAction[] {
  const swaps: SwapAction[] = [];
  const totalValue = portfolio.total_value_usd;
  
  // Convert percentage allocations to USD values
  const targetValues: Record<TokenCategory, number> = {
    [TokenCategory.STABLECOIN]: (targetAllocation[TokenCategory.STABLECOIN] / 100) * totalValue,
    [TokenCategory.NATIVE]: (targetAllocation[TokenCategory.NATIVE] / 100) * totalValue,
    [TokenCategory.OTHER]: (targetAllocation[TokenCategory.OTHER] / 100) * totalValue
  };
  
  const currentValues: Record<TokenCategory, number> = {
    [TokenCategory.STABLECOIN]: (currentAllocation[TokenCategory.STABLECOIN] / 100) * totalValue,
    [TokenCategory.NATIVE]: (currentAllocation[TokenCategory.NATIVE] / 100) * totalValue,
    [TokenCategory.OTHER]: (currentAllocation[TokenCategory.OTHER] / 100) * totalValue
  };
  
  const categoriesToReduce: TokenCategory[] = [];
  const categoriesToIncrease: TokenCategory[] = [];
  
  Object.values(TokenCategory).forEach(category => {
    if (currentValues[category] > targetValues[category]) {
      categoriesToReduce.push(category);
    } else if (currentValues[category] < targetValues[category]) {
      categoriesToIncrease.push(category);
    }
  });

  for (const fromCategory of categoriesToReduce) {
    const tokensToReduce = portfolio.tokens.filter(t => t.category === fromCategory);
    tokensToReduce.sort((a, b) => b.value_usd - a.value_usd);
    
    let valueToReduce = currentValues[fromCategory] - targetValues[fromCategory]; //let's say this is 5 usd
    console.log("the vlaue to reduce is:",valueToReduce)
    for (const increaseCategory of categoriesToIncrease) {
      const valueToIncrease = targetValues[increaseCategory] - currentValues[increaseCategory];
      
      if (valueToIncrease <= 0) continue;

      // Find a suitable token to swap to in the target category
      const tokensToIncrease = portfolio.tokens.filter(t => t.category === increaseCategory);

      const toTokenAddress = tokensToIncrease.length > 0 ? tokensToIncrease[0].tokenAddress : (
        increaseCategory === TokenCategory.STABLECOIN ? "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC" : // USDC
        increaseCategory === TokenCategory.NATIVE ? "0x1::aptos_coin::AptosCoin" : // APT
        "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL" // THL
      );
      
      // Calculate swap amount based on the minimum of what we need to reduce and increase
      const swapValue = Math.min(valueToReduce, valueToIncrease);
      let remainingSwapValue = swapValue;
      
      // Create swaps for each source token until we've reached the total needed
      for (const fromToken of tokensToReduce) {
        if (remainingSwapValue <= 0) break;
        
        const swapAmountFromThisToken = Math.min(fromToken.value_usd, remainingSwapValue);
        console.log(swapAmountFromThisToken)
        const tokenAmount = (swapAmountFromThisToken / Number(fromToken.price_usd));
        // *(10**Number(fromToken.decimals));
        
        swaps.push({
          from_token_address: fromToken.tokenAddress,
          to_token_address: toTokenAddress,
          amount: tokenAmount,
          chainId: 12, // Adjust as needed for the chain,
          fromTokenDecimals:fromToken.decimals
        });
        
        remainingSwapValue -= swapAmountFromThisToken;
      }
     
      valueToReduce -= swapValue;
      if (valueToReduce <= 0) break;
    }
    
  }
  console.log("the swaps are",swaps)
  return swaps;
}

/**
 * Executes a swap transaction
 */
async function executeSwap(swap: SwapAction): Promise<boolean> {
  try {
    console.log(`Executing swap: ${swap.amount} of ${swap.from_token_address} to ${swap.to_token_address}`);
  //   const Setup=await InitializeAgent();
  //   const agent=Setup?.agent
  //   if(agent!==undefined){
  //     const response = [];
  //     const config = { 
  //       configurable: { 
  //         thread_id: `aptos-agent-1` 
  //       } 
  //       };
  //     const stream = await agent.stream(
  //       {
  //         messages: [new HumanMessage(`Swap ${swap.amount.toFixed(swap.fromTokenDecimals)} of ${swap.from_token_address} to ${swap.to_token_address}`)],
  //       },
  //       config
  //       )
  //  for await (const chunk of stream) {
	// 	if ("agent" in chunk) {
	// 	  response.push({
	// 		type: "agent",
	// 		content: chunk.agent.messages[0].content
	// 	  });
	// 	} else if ("tools" in chunk) {
	// 	  response.push({
	// 		type: "tools",
	// 		content: chunk.tools.messages[0].content
	// 	  });
	// 	}
	//   }
	//   console.log({
	// 	agentResponse: response,
	//   });
  // }
    // const response = await client.Swap(
    //   {
    //     chainId:"1",
    //     fromTokenAddress: swap.from_token_address as `0x${string}`,
    //     toTokenAddress: swap.to_token_address as `0x${string}`,
    //     fromTokenAmount: swap.amount.toString(),
    //     toWalletAddress: "0x5bafe2c53415743947065e902274f85e6300e9fb27d21bc29c2ce217ea0b37c2", // Set this appropriately
    //     slippagePercentage: "1",
    //     integratorFeeAddress: "0x5bafe2c53415743947065e902274f85e6300e9fb27d21bc29c2ce217ea0b37c2",
    //     integratorFeePercentage: "1",
    //   },
    //   process.env.PRIVATE_KEY || ""
    // );
    // console.log("the hash for the traxn is:",response.hash)
     return true;
  } catch (error) {
    console.error("Swap failed:", error);
    return false;
  }
}

/**
 * LangChain tool for portfolio rebalancing
 */
export const PortfolioRebalancerTool = tool(
  async ({
    stablecoinPercentage,
    nativePercentage,
    otherPercentage,
  }) => {
    try {
      const accountAddress="0x5bafe2c53415743947065e902274f85e6300e9fb27d21bc29c2ce217ea0b37c2";
      const existingPreference = await getUserDiversificationPreference(accountAddress);
      
      // If no percentages were provided, use existing preferences if available
      if (stablecoinPercentage === undefined && nativePercentage === undefined && otherPercentage === undefined) {
        if (!existingPreference) {
          return {
            success: false,
            message: "No target allocation provided and no existing preferences found."
          };
        }
        
        stablecoinPercentage = existingPreference.targetAllocation[TokenCategory.STABLECOIN];
        nativePercentage = existingPreference.targetAllocation[TokenCategory.NATIVE];
        otherPercentage = existingPreference.targetAllocation[TokenCategory.OTHER];
      }
      
      // Validate that allocations add up to 100%
      const totalPercentage = stablecoinPercentage + nativePercentage + otherPercentage;
      if (totalPercentage !== 100) {
        return {
          success: false,
          message: `Invalid allocation. Your percentages must add up to 100%, but they currently add up to ${totalPercentage}%.`
        };
      }

      // Create target allocation object
      const targetAllocation: Record<TokenCategory, number> = {
        [TokenCategory.STABLECOIN]: stablecoinPercentage,
        [TokenCategory.NATIVE]: nativePercentage,
        [TokenCategory.OTHER]: otherPercentage
      };
      
      // Fetch current portfolio
      const userPortfolio = await fetchUserPortfolio(accountAddress);
      
      // Calculate current allocation and required swaps
      const currentAllocation = calculateCurrentAllocation(userPortfolio);
      const requiredSwaps = calculateRequiredSwaps(
        userPortfolio,
        currentAllocation,
        targetAllocation
      );
      
      // No swaps needed if portfolio already matches target allocation
      if (requiredSwaps.length === 0) {
        // Still save the user preference
        await saveUserPreference(accountAddress, targetAllocation);
        
        return {
          success: true,
          message: "Portfolio is already balanced according to target allocation.",
          currentAllocation,
          targetAllocation,
          userPortfolio
        };
      }
      
      // Execute swaps
      const swapResults = [];
      let allSwapsSuccessful = true;
      
      for (const swap of requiredSwaps) {
        const success = await executeSwap(swap);
        swapResults.push({
          from: swap.from_token_address,
          to: swap.to_token_address,
          amount: swap.amount,
          success
        });
        
        if (!success) {
          allSwapsSuccessful = false;
        }
      }
      
      // Only update the user preference if all swaps were successful
      if (allSwapsSuccessful) {
        await saveUserPreference(accountAddress, targetAllocation);
      }

      // Return results
      return {
        success: true,
        message: allSwapsSuccessful 
          ? "Portfolio rebalancing complete" 
          : "Portfolio rebalancing partially complete with some failed swaps",
        currentAllocation,
        targetAllocation,
        swapsExecuted: swapResults,
        userPortfolio,
        preferencesUpdated: allSwapsSuccessful
      };
    } catch (error) {
      console.error("Portfolio rebalancing failed:", error);
      return {
        success: false,
        message: `Portfolio rebalancing failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
  {
    name: "portfolioRebalancerTool",
    description: "Rebalances a user's crypto portfolio based on desired asset distribution across different categories",
    schema: Zod.object({
      stablecoinPercentage: Zod.number().min(0).max(100).describe("The desired percentage allocation for stablecoins (USDC, USDt, etc.)"),
      nativePercentage: Zod.number().min(0).max(100).describe("The desired percentage allocation for native tokens (APT)"),
      otherPercentage: Zod.number().min(0).max(100).describe("The desired percentage allocation for other tokens (THL, etc.)"),
    })
  }
);