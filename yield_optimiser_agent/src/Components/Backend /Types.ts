export interface SupabaseToken {
    id: number;
    token_address: string;
    decimals: number;
    type: string;
    chain_id: number;
    name:string;
}

// Define interfaces
export interface ExchangeRate {
    exchange: string;
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
    timestamp: number;
  }
  
export interface ArbitrageOpportunity {
    path: string[];
    exchanges: string[];
    potentialProfit: number;
    startAmount: number;
    endAmount: number;
    profitPercentage: number;
    timestamp: number;
    executionFee: number;
    netProfit: number;
  }
  

export enum CoinGeckoId{
   usdt = "layerzero-bridged-usdt-aptos",
   aptos="aptos",
   usdc="layerzero-bridged-usdc-aptos",
   weth="layerzero-bridged-weth-aptos",
   thala="thala"
}


export interface UserChatSummary{
  chatId:number;
  user_query:string;
  firstMessageDate:number;
}