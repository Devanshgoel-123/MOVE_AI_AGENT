import axios from "axios";
import { fetchSupportedTokens } from "../Common/Token";
import { z as Zod } from "zod";
import { tool } from "@langchain/core/tools";
export const fetch24HChangeForTokens=async()=>{
    try{
        const tokensArray=await fetchSupportedTokens();
        const formattedTokens = tokensArray.map((item) => {
          const chainName = "aptos"
          return `${chainName}:${item.token_address}`;
        }).join(",");
        const response=await axios.get(`https://coins.llama.fi/percentage/${formattedTokens}`,{
            headers:{
                "Accept":"application/json"
            }
        })
        console.log(response.data.coins)
        const extractedData = Object.entries(response.data.coins).map(([key, change]) => {
            const tokenAddress = key.split(':')[1];
            const tokenDetails=tokensArray.filter((item)=>item.token_address===tokenAddress)
            return { 
                tokenAddress:tokenAddress,
                change24H:change,
                name:tokenDetails[0].name,
            };
          });
          return extractedData;
    }catch(err){
        console.log(err)
        throw new Error("Failed fetching the 24hr change")
    }  
  }


  export const Find24HChangeTool=tool(
    async ({tokenName}) => {
      try {
        console.log(`Fetching the 24h change of ${tokenName}...`);
        const result=await fetch24HChangeForTokens();
        console.log("the 24change response is:",result)
        return result
      } catch (error) {
        console.error("Error in Predicting the price of token:", error);
        return {
          success: false,
          message: `Error Predicting price of token : ${error}`
        };
      }
    },
    {
      name: "Find24HChangeTool",
      description: "Fetches the % change of tokens over the 24h",
      schema: Zod.object({
        tokenName: Zod.string().describe("The token to find the %change for."),
      })
    }
  )