import { tool } from "@langchain/core/tools";
import { z as Zod } from "zod";
import Panora, { PanoraConfig } from "@panoraexchange/swap-sdk";
import { config } from "dotenv";
import { ExchangeRate } from "../Types";
import { ArbitrageOpportunity } from "../Types";
config();

const panoraConfig: PanoraConfig = {
  apiKey: process.env.PANORA_API_KEY || "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
  rpcUrl: ""
};

const panoraClient = new Panora(panoraConfig);

const exchanges = [
  { name: "Econia", apiEndpoint: "https://api.econia.exchange/v1" },
  { name: "Hippo", apiEndpoint: "https://api.hippo.exchange/v1" },
  { name: "Pontem", apiEndpoint: "https://api.pontem.exchange/v1" },
  { name: "Ditto", apiEndpoint: "https://api.ditto.exchange/v1" }
];

// Supported tokens
const supportedTokens = [
  { symbol: "APT", name: "Aptos Coin", address: "0x1::aptos_coin::AptosCoin", decimals: 8 },
  { symbol: "USDC", name: "USD Coin", address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC", decimals: 6 },
  { symbol: "USDt", name: "Tether USD", address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT", decimals: 6 },
  { symbol: "WETH", name: "Wrapped Ethereum", address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH", decimals: 8 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC", decimals: 8 },
  { symbol: "THL", name: "Thala Token", address: "0x7fd500c11216f0fe3095d0c4b8aa4d64a4e2e04f83758462f2b127255643615::thl_coin::THL", decimals: 6 }
];

// Cache exchange rates to minimize API calls
let rateCache: ExchangeRate[] = [];
const CACHE_EXPIRY = 60000; // 60 seconds

/**
 * Fetches the current exchange rate for a token pair from a specific exchange
 */
async function fetchExchangeRate(exchange: string, baseCurrency: string, quoteCurrency: string): Promise<number> {
  // Check cache first
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
  
  // In a real implementation, fetch actual rates from exchange APIs
  // For demonstration, we'll use simulated rates with small variations
  
  // Find the exchange object
  const exchangeObj = exchanges.find(e => e.name === exchange);
  if (!exchangeObj) {
    throw new Error(`Exchange ${exchange} not supported`);
  }
  
  try {
    // In production: Make actual API call to the exchange
    // const response = await axios.get(`${exchangeObj.apiEndpoint}/price?base=${baseCurrency}&quote=${quoteCurrency}`);
    // const rate = response.data.rate;
    
    // For demonstration, generate slightly different rates per exchange
    const baseRate = getBaseRate(baseCurrency, quoteCurrency);
    const randomVariation = (Math.random() * 0.05) - 0.025; // +/- 2.5%
    const rate = baseRate * (1 + randomVariation);
    
    // Update cache
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

/**
 * Returns a base rate for a token pair (for demonstration purposes)
 */
function getBaseRate(baseCurrency: string, quoteCurrency: string): number {
  // Base rates for common pairs
  const baseRates: Record<string, Record<string, number>> = {
    "APT": {
      "USDC": 8.25,
      "USDt": 8.24,
      "WETH": 0.0031,
      "WBTC": 0.00013,
      "THL": 160.5
    },
    "USDC": {
      "APT": 0.121,
      "USDt": 0.999,
      "WETH": 0.00037,
      "WBTC": 0.000015,
      "THL": 20.0
    },
    "USDt": {
      "APT": 0.1212,
      "USDC": 1.001,
      "WETH": 0.00037,
      "WBTC": 0.000015,
      "THL": 19.8
    },
    "WETH": {
      "APT": 325.0,
      "USDC": 2700.0,
      "USDt": 2699.0,
      "WBTC": 0.045,
      "THL": 52000.0
    },
    "WBTC": {
      "APT": 7650.0,
      "USDC": 63000.0,
      "USDt": 62950.0,
      "WETH": 22.0,
      "THL": 1250000.0
    },
    "THL": {
      "APT": 0.0062,
      "USDC": 0.05,
      "USDt": 0.0505,
      "WETH": 0.000019,
      "WBTC": 0.0000008
    }
  };
  
  if (baseRates[baseCurrency] && baseRates[baseCurrency][quoteCurrency]) {
    return baseRates[baseCurrency][quoteCurrency];
  } else if (baseRates[quoteCurrency] && baseRates[quoteCurrency][baseCurrency]) {
    return 1 / baseRates[quoteCurrency][baseCurrency];
  } else {
    return 1.0; // Default fallback
  }
}

/**
 * Finds the best exchange for a given token pair
 */
async function findBestExchange(baseCurrency: string, quoteCurrency: string): Promise<{ exchange: string; rate: number }> {
  const rates: { exchange: string; rate: number }[] = [];
  
  for (const exchange of exchanges) {
    try {
      const rate = await fetchExchangeRate(exchange.name, baseCurrency, quoteCurrency);
      rates.push({ exchange: exchange.name, rate });
    } catch (error) {
      console.warn(`Skipping ${exchange.name} for ${baseCurrency}/${quoteCurrency}: ${error}`);
    }
  }
  
  if (rates.length === 0) {
    throw new Error(`No exchange rates available for ${baseCurrency}/${quoteCurrency}`);
  }
  
  // Sort by best rate (highest if selling base, lowest if buying base)
  rates.sort((a, b) => b.rate - a.rate);
  
  return rates[0];
}

/**
 * Finds arbitrage opportunities across exchanges
 */
async function findArbitrageOpportunities(
  startCurrency: string, 
  investmentAmount: number,
  maxPathLength: number = 3,
  minimumProfitPercentage: number = 0.5
): Promise<ArbitrageOpportunity[]> {
  const opportunities: ArbitrageOpportunity[] = [];
  const tokenSymbols = supportedTokens.map(t => t.symbol);
  
  // Find direct arbitrage (buy on one exchange, sell on another)
  for (const targetCurrency of tokenSymbols) {
    if (targetCurrency === startCurrency) continue;
    
    try {
      // For all exchange combinations
      for (const buyExchange of exchanges) {
        for (const sellExchange of exchanges) {
          if (buyExchange.name === sellExchange.name) continue;
          
          const buyRate = await fetchExchangeRate(buyExchange.name, startCurrency, targetCurrency);
          const sellRate = await fetchExchangeRate(sellExchange.name, targetCurrency, startCurrency);
          
          // Calculate potential profit
          const targetAmount = investmentAmount / buyRate;
          const endAmount = targetAmount * sellRate;
          const profitAmount = endAmount - investmentAmount;
          const profitPercentage = (profitAmount / investmentAmount) * 100;
          
          // Estimate execution fees (in a real implementation, fetch actual fees)
          const executionFee = 0.003 * investmentAmount; // Assuming 0.3% fee
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
  
  // For triangular arbitrage (A → B → C → A)
  if (maxPathLength >= 3) {
    for (const middleCurrency of tokenSymbols) {
      if (middleCurrency === startCurrency) continue;
      
      for (const endCurrency of tokenSymbols) {
        if (endCurrency === startCurrency || endCurrency === middleCurrency) continue;
        
        try {
          // Find best exchanges for each leg
          const leg1 = await findBestExchange(startCurrency, middleCurrency);
          const leg2 = await findBestExchange(middleCurrency, endCurrency);
          const leg3 = await findBestExchange(endCurrency, startCurrency);
          
          // Calculate potential profit
          const middleAmount = investmentAmount / leg1.rate;
          const endAmount = middleAmount / leg2.rate;
          const finalAmount = endAmount * leg3.rate;
          
          const profitAmount = finalAmount - investmentAmount;
          const profitPercentage = (profitAmount / investmentAmount) * 100;
          
          // Estimate execution fees
          const executionFee = 0.003 * 3 * investmentAmount; // 0.3% fee × 3 trades
          const netProfit = profitAmount - executionFee;
          const netProfitPercentage = (netProfit / investmentAmount) * 100;
          
          if (netProfitPercentage >= minimumProfitPercentage) {
            opportunities.push({
              path: [startCurrency, middleCurrency, endCurrency, startCurrency],
              exchanges: [leg1.exchange, leg2.exchange, leg3.exchange],
              potentialProfit: profitAmount,
              startAmount: investmentAmount,
              endAmount: finalAmount,
              profitPercentage: profitPercentage,
              timestamp: Date.now(),
              executionFee: executionFee,
              netProfit: netProfit
            });
          }
        } catch (error) {
          console.warn(`Error checking triangular arbitrage for ${startCurrency}/${middleCurrency}/${endCurrency}: ${error}`);
        }
      }
    }
  }
  
  // Sort by profitability
  opportunities.sort((a, b) => b.netProfit - a.netProfit);
  
  return opportunities;
}

/**
 * Execute an arbitrage opportunity
 */
async function executeArbitrage(opportunity: ArbitrageOpportunity, walletAddress: string): Promise<boolean> {
  try {
    console.log(`Executing arbitrage: ${opportunity.path.join(' → ')} via ${opportunity.exchanges.join(', ')}`);
    for (let i = 0; i < opportunity.path.length - 1; i++) {
      const fromToken = supportedTokens.find(t => t.symbol === opportunity.path[i]);
      const toToken = supportedTokens.find(t => t.symbol === opportunity.path[i + 1]);
      const exchange = opportunity.exchanges[i];
      
      if (!fromToken || !toToken) {
        throw new Error(`Token not found: ${fromToken ? toToken?.symbol : 'unknown'}`);
      }
      
      console.log(`Step ${i+1}: Swapping ${fromToken.symbol} to ${toToken.symbol} on ${exchange}`);
      
      // For demonstration purposes only
      // In production, use the proper swap method with the exchange's API
      
      // Example with Panora (would need proper amount calculation)
      /*
      await panoraClient.Swap(
        {
          chainId: "1",
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          fromTokenAmount: "1", // Would calculate proper amount here
          toWalletAddress: walletAddress,
          slippagePercentage: "1",
          integratorFeeAddress: walletAddress,
          integratorFeePercentage: "0.1",
        },
        process.env.PRIVATE_KEY || ""
      );
      */
    }
    
    return true;
  } catch (error) {
    console.error("Failed to execute arbitrage:", error);
    return false;
  }
}

// Create the arbitrage finder tool
export const ArbitrageFinderTool = tool(
  async ({ startCurrency, investmentAmount, maxPathLength, minimumProfitPercentage, walletAddress, executeTop }) => {
    try {
      console.log(`Finding arbitrage opportunities starting with ${startCurrency}...`);
      
      // Validate input parameters
      if (!supportedTokens.some(t => t.symbol === startCurrency)) {
        return {
          success: false,
          message: `Unsupported token: ${startCurrency}. Supported tokens are: ${supportedTokens.map(t => t.symbol).join(', ')}`
        };
      }
      
      if (investmentAmount <= 0) {
        return {
          success: false,
          message: "Investment amount must be greater than zero"
        };
      }
      
      // Find opportunities
      const opportunities = await findArbitrageOpportunities(
        startCurrency,
        investmentAmount,
        maxPathLength,
        minimumProfitPercentage
      );
      
      if (opportunities.length === 0) {
        return {
          success: true,
          message: "No profitable arbitrage opportunities found with the given parameters",
          opportunities: []
        };
      }
      
      // Execute top opportunity if requested
      let executionResult = null;
      if (executeTop && opportunities.length > 0) {
        executionResult = await executeArbitrage(opportunities[0], walletAddress || "");
      }
      
      return {
        success: true,
        message: `Found ${opportunities.length} arbitrage opportunities`,
        opportunities: opportunities.slice(0, 5), // Return top 5 opportunities
        executionResult: executeTop ? {
          executed: true,
          success: executionResult,
          opportunity: opportunities[0]
        } : null
      };
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
      maxPathLength: Zod.number().min(2).max(4).optional().describe("Maximum number of trades in the arbitrage path (2-4, default: 3)"),
      minimumProfitPercentage: Zod.number().min(0).optional().describe("Minimum profit percentage to consider an opportunity (default: 0.5%)"),
      walletAddress: Zod.string().optional().describe("Wallet address to receive the funds if executing the arbitrage"),
      executeTop: Zod.boolean().optional().describe("Whether to actually execute the top arbitrage opportunity (default: false)")
    })
  }
);