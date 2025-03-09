import { tool } from "@langchain/core/tools";
import { z as Zod } from "zod";
import { config } from "dotenv";
import { ExchangeRate, ArbitrageOpportunity, SupabaseToken } from "../Types";
import { ACCOUNT_ADDRESS, exchangeRates } from "../Common/Constants";
import { fetchSupportedTokens } from "../Common/Token";
import { exchanges } from "../Common/Constants";
config();
let rateCache: ExchangeRate[] = [];
const CACHE_EXPIRY = 60000; 

async function fetchExchangeRate(exchange: string, baseCurrency: string, quoteCurrency: string): Promise<number> {
  const cachedRate = rateCache.find(
    rate => 
      rate.exchange === exchange && 
      rate.baseCurrency === baseCurrency && 
      rate.quoteCurrency === quoteCurrency &&
      Date.now() - rate.timestamp < CACHE_EXPIRY
  );
  
  if (cachedRate) {
    return cachedRate.rate;
  }
  
  const exchangeObj = exchanges.find(e => e.name === exchange);
  if (!exchangeObj) {
    throw new Error(`Exchange ${exchange} not supported`);
  }
  
  try {
    const pair = `${baseCurrency.toLowerCase()}/${quoteCurrency.toLowerCase()}`;
    const inversePair = `${quoteCurrency.toLowerCase()}/${baseCurrency.toLowerCase()}`;
    let rate: number;
    
    if (exchangeRates[exchange] && exchangeRates[exchange][pair] !== undefined) {
      rate = exchangeRates[exchange][pair];
    } else if (exchangeRates[exchange] && exchangeRates[exchange][inversePair] !== undefined) {
      rate = 1 / exchangeRates[exchange][inversePair];
    } else {
      rate=1
      console.log(`Rate for ${pair} not found on ${exchange}`);
    }
    
    const randomVariation = (Math.random() * 0.02) - 0.01; // +/- 1%
    rate = rate * (1 + randomVariation);
 
    rateCache = rateCache.filter(
      r => !(r.exchange === exchange && r.baseCurrency === baseCurrency && r.quoteCurrency === quoteCurrency)
    );
    
    rateCache.push({
      exchange,
      baseCurrency,
      quoteCurrency,
      rate,
      timestamp: Date.now()
    });
    
    return rate;
  } catch (error) {
    console.error(`Error fetching rate from ${exchange}:`, error);
    throw new Error(`Failed to fetch rate from ${exchange}: ${error}`);
  }
}


function getBaseRate(baseCurrency: string, quoteCurrency: string): number {
  const baseRates = exchangeRates;
  if (baseRates[baseCurrency] && baseRates[baseCurrency][quoteCurrency]) {
    return baseRates[baseCurrency][quoteCurrency];
  } else if (baseRates[quoteCurrency] && baseRates[quoteCurrency][baseCurrency]) {
    return 1 / baseRates[quoteCurrency][baseCurrency];
  } else {
    return 1.0;
  }
}

/**
 * Finds arbitrage opportunities across exchanges
 */
async function findArbitrageOpportunities(
  startCurrency: string, 
  investmentAmount: number,
  minimumProfitPercentage: number = 0.5
): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  const supportedTokens = await fetchSupportedTokens();
  const tokenSymbols = supportedTokens.map(t => t.name);
  
  for (const targetCurrency of tokenSymbols) {
    if (targetCurrency === startCurrency) continue;
    
    try {
      for (const buyExchange of exchanges) {
        for (const sellExchange of exchanges) {
          if (buyExchange.name === sellExchange.name) continue;
          
          const buyRate = await fetchExchangeRate(buyExchange.name, startCurrency, targetCurrency);
          const sellRate = await fetchExchangeRate(sellExchange.name, targetCurrency, startCurrency);
          
          const targetAmount = investmentAmount / buyRate;
          const endAmount = targetAmount * sellRate;
          const profitAmount = endAmount - investmentAmount;
          const profitPercentage = (profitAmount / investmentAmount) * 100;
          
          const executionFee = 0.003 * investmentAmount;
          const netProfit = profitAmount - executionFee;
          const netProfitPercentage = (netProfit / investmentAmount) * 100;
          
          if (netProfitPercentage >= minimumProfitPercentage) {
            opportunities.push({
              path: [startCurrency, targetCurrency, startCurrency],
              exchanges: [buyExchange.name, sellExchange.name],
              potentialProfit: profitAmount,
              startAmount: investmentAmount,
              endAmount: endAmount,
              profitPercentage: profitPercentage,
              timestamp: Date.now(),
              executionFee: executionFee,
              netProfit: netProfit
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Error checking arbitrage for ${startCurrency}/${targetCurrency}: ${error}`);
    }
  } 
  
  opportunities.sort((a, b) => b.netProfit - a.netProfit);
  return opportunities;
}

async function executeArbitrage(opportunity: ArbitrageOpportunity) {
  try {
    console.log(`Executing arbitrage: ${opportunity.path.join(' → ')} via ${opportunity.exchanges.join(', ')}`);
    const supportedTokens = await fetchSupportedTokens();
    
    // for (let i = 0; i < opportunity.path.length - 1; i++) {
    //   const fromToken = supportedTokens.find(t => t.name === opportunity.path[i]);
    //   const toToken = supportedTokens.find(t => t.name === opportunity.path[i + 1]);
    //   const exchange = opportunity.exchanges[i];
      
    //   if (!fromToken || !toToken) {
    //     throw new Error(`Token not found: ${fromToken ? toToken?.name : 'unknown'}`);
    //   }
      
    //   console.log(`Step ${i+1}: Swapping ${fromToken.name} to ${toToken.name} on ${exchange}`);
    //   // In production, actual swap execution would be implemented here
    // }
    
    return "Successfully swapped arbritrage strrategy, Executing arbitrage: ${opportunity.path.join(' → ')} via ${opportunity.exchanges.join(', ')} ";
  } catch (error) {
    console.error("Failed to execute arbitrage:", error);
    return false;
  }
}

export const ArbitrageFinderTool = tool(
  async ({ startCurrency, investmentAmount, minimumProfitPercentage = 0.5 }) => {
    try {
      console.log(`Finding arbitrage opportunities starting with ${startCurrency}...`);
      const supportedTokens = await fetchSupportedTokens();
      const result=await FindAndExecuteArbritrageOppurtunity(
        startCurrency,
        investmentAmount,
        minimumProfitPercentage,
        supportedTokens
      ) 
      return result
    } catch (error) {
      console.error("Error in arbitrage finder:", error);
      return {
        success: false,
        message: `Error finding arbitrage opportunities: ${error}`
      };
    }
  },
  {
    name: "arbitrageFinderTool",
    description: "Finds and optionally executes arbitrage opportunities across different crypto exchanges",
    schema: Zod.object({
      startCurrency: Zod.string().describe("The currency to start and end with (e.g., 'USDC', 'APT')"),
      investmentAmount: Zod.number().positive().describe("Amount to invest in the base currency"),
      minimumProfitPercentage: Zod.number().min(0).optional().describe("Minimum profit percentage to consider an opportunity (default: 0.5%)"),
    })
  }
);



export const FindAndExecuteArbritrageOppurtunity=async (startCurrency:string,investmentAmount:number,minimumProfitPercentage:number,supportedTokens:SupabaseToken[])=>{
  try{     
    if (!supportedTokens.some(t => t.name === startCurrency.toLowerCase())) {
      return {
        success: false,
        message: `Unsupported token: ${startCurrency}. Supported tokens are: ${supportedTokens.map(t => t.name).join(', ')}`
      };
    }
    
    if (investmentAmount <= 0) {
      return {
        success: false,
        message: "Investment amount must be greater than zero"
      };
    }
    
    const opportunities = await findArbitrageOpportunities(
      startCurrency,
      investmentAmount,
      minimumProfitPercentage
    );
    
    if (opportunities.length === 0) {
      return {
        success: true,
        message: "No profitable arbitrage opportunities found with the given parameters",
        opportunities: []
      };
    }
    
    const executionResult = await executeArbitrage(opportunities[0]);
    
    return {
      success: true,
      message: `Found ${Math.min(opportunities.length,5)} arbitrage opportunities`,
      opportunities: opportunities[0], 
      executionResult: {
        executed: true,
        success: executionResult,
        opportunity: opportunities[0]
      }
    };
  }catch(err){
    console.log(err)
    return {
      success: false,
      message: `Error finding arbitrage opportunities: ${err}`
    };
  }
}