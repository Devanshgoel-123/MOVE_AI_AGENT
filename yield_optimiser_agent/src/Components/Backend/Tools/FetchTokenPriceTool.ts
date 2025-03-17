
import { tool } from "@langchain/core/tools";
import { z as Zod } from "zod";
import { fetchSupportedTokens, fetchTokenPriceInUsd } from "../Common/Token";
export const FetchTokenPriceInUsdTool = tool(
    async ({ tokenName}) => {
      try {
        const tokenAddress=(await fetchSupportedTokens()).filter((item)=>item.name.toLowerCase()===tokenName.toLowerCase())[0].token_address
        const priceInUsd=await fetchTokenPriceInUsd(tokenAddress)
        return priceInUsd
      } catch (error) {
        console.error("Error fetching user preference:", error);
        return {
          success: false,
          message: `Error fetching diversification preference: ${error instanceof Error ? error.message : String(error)}`,
          hasPreference: false
        };
      }
    },
    {
      name: "fetchTokenPriceInUsdTool",
      description: "Fetches the price of a token in usd ",
      schema: Zod.object({
       tokenName: Zod.string().describe("The name of the token to find price of")
      })
    }
  );
  
  