export const DEFAULT_STABLE = 50;
export const DEFAULT_NATIVE = 30;
export const DEFAULT_OTHER = 30;
export const ACCOUNT_ADDRESS = "0x5bafe2c53415743947065e902274f85e6300e9fb27d21bc29c2ce217ea0b37c2";

export const exchangeRates: Record<string, Record<string, number>> = {
  Econia: {
    "apt/usdc": 8.20,     // Buy apt with usdc: 1 apt costs 8.20 usdc
    "usdc/apt": 0.118,    // Buy usdc with apt: 1 usdc costs 0.118 apt (= 8.47 apt/usdc)
    "apt/usdt": 8.22,
    "usdt/apt": 0.119,
    "weth/usdc": 2705,
    "usdc/weth": 0.000362,
  },
  Hippo: {
    "apt/usdc": 8.50,    
    "usdc/apt": 0.114,    // = 8.77 apt/usdc
    "apt/usdt": 8.21,
    "usdt/apt": 0.118,
    "weth/usdc": 2650,   
    "usdc/weth": 0.000375, // = 2666 weth/usdc
  },
  Pontem: {
    "apt/usdc": 8.25,
    "usdc/apt": 0.121,    // = 8.26 apt/usdc
    "apt/usdt": 8.10,     // Cheaper apt with usdt
    "usdt/apt": 0.121,    // = 8.26 apt/usdt
    "weth/usdc": 2750,    // Sell ETH at higher price here
    "usdc/weth": 0.000358, // = 2793 weth/usdc
  },
  Ditto: {
    "apt/usdc": 8.19,
    "usdc/apt": 0.120,   
    "apt/usdt": 8.40,     
    "usdt/apt": 0.116,    
    "weth/usdc": 2712,
    "usdc/weth": 0.000366,
  }
};

export const exchanges = [
  { name: "Econia", apiEndpoint: "https://api.econia.exchange/v1" },
  { name: "Hippo", apiEndpoint: "https://api.hippo.exchange/v1" },
  { name: "Pontem", apiEndpoint: "https://api.pontem.exchange/v1" },
  { name: "Ditto", apiEndpoint: "https://api.ditto.exchange/v1" }
];


export const DAPP_LOGO="https://images.scalebranding.com/cute-robot-logo-2c42937a-c1fe-493a-b639-d22a0b5f4671.png";