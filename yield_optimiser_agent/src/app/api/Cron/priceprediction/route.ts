import { ACCOUNT_ADDRESS } from "@/Components/Backend/Common/Constants";
import { fetchSupportedTokens, getTokenAmountOwnedByAccount } from "@/Components/Backend/Common/Token";
import { FindAndExecuteArbritrageOppurtunity } from "@/Components/Backend/Tools/ArbritrageFinder";
import { PredictNextDayPrice } from "@/Components/Backend/Tools/PricePredictionTool";
import { HumanMessage } from "@langchain/core/messages";
import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { AgentRuntime, AptosGetTokenDetailTool, AptosGetTokenPriceTool, createAptosTools, JouleGetPoolDetails, JouleGetUserAllPositions, LiquidSwapSwapTool, PanoraSwapTool, ThalaStakeTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { PortfolioRebalancerTool } from "@/Components/Backend/Tools/PortfolioManager"
import { MemorySaver } from "@langchain/langgraph"
import { FetchTokenPriceInUsdTool } from "@/Components/Backend/Tools/FetchTokenPriceTool"
config()

export async function GET(request: Request) {
    try{ 
        const tokens=await fetchSupportedTokens();
        const tokenName=tokens.map(item => item.name)
        const futurePrice=await Promise.all(tokenName.map(async (name) => {
            const price=await PredictNextDayPrice(name);
            return `The Predicted Price of ${name} is ${price.toFixed(4)} Usd`
        }))
        const aptosConfig = new AptosConfig({
			network: Network.MAINNET,
		})
		const aptos = new Aptos(aptosConfig)
		const account = await aptos.deriveAccountFromPrivateKey({
			privateKey: new Ed25519PrivateKey(
				PrivateKey.formatPrivateKey(`${process.env.PRIVATE_KEY}`, PrivateKeyVariants.Ed25519)
			),
		})
		const signer = new LocalSigner(account, Network.MAINNET)
		const agentRuntime = new AgentRuntime(signer, aptos,{
			PANORA_API_KEY: "a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
		})
		const llm = new ChatAnthropic({
			model: "claude-3-5-sonnet-latest",
			anthropicApiKey: process.env.ANTHROPIC_API_KEY,
		})
		const memory5 = new MemorySaver()
		const PredictorSwapCronAgent = createReactAgent({
			llm,
			tools:[
				new PanoraSwapTool(agentRuntime),
				FetchTokenPriceInUsdTool,
				new LiquidSwapSwapTool(agentRuntime),
			],
			checkpointSaver: memory5,
               
            messageModifier: `
                        You are an intelligent on-chain agent that interacts with the Aptos blockchain via the Aptos Agent Kit. Your key capabilities include:
            - Fetching token details and current market prices.
            - Predicting future token prices.
            - Calculating percentage changes and identifying significant price drops.
            - Executing swaps via LiquidSwap if a token's predicted price is expected to drop by more than 20%.
            - If a Transaction is being sent wait for the transaction to be completed and then return the hash of the transaction.
            ### Instructions:
            1. **Predict Future Price:** Use \`PredictNextDayPrice\` for all supported tokens.
            2. **Fetch Current Price:** Use \`FetchTokenPriceInUsdTool\` for real-time prices.
            3. **Calculate % Change:**
               - Formula: \`((Predicted Price - Current Price) / Current Price) * 100\`
            4. **Decision Making:**
               - If \`% Change ≤ -20%\`, **recommend swapping to USDC** using \`LiquidSwapSwapTool\`.
               - If \`% Change > -20%\`, advise the user whether to hold or monitor.
               `,
		})
        const config = { 
            configurable: { 
              thread_id: `aptos-agent-1` 
            } 
          };
          const response = [];
          
          const stream = await PredictorSwapCronAgent.stream(
            {
              messages: [new HumanMessage(`You have the future predicted price of the follwoing tokens : ${futurePrice}. Now use the FetchTokenPriceInUsdTool to find the current price of a token, if the price of a token is expected to fall over 20% then swap that token to usdc or usdt whichever gets the better rate.`)],
            },
            config
          );
      
          for await (const chunk of stream) {
            if ("agent" in chunk) {
              response.push({
                type: "agent",
                content: chunk.agent.messages[0].content
              });
            } else if ("tools" in chunk) {
              response.push({
                type: "tools",
                content: chunk.tools.messages[0].content
              });
            }
          }
        console.log("the future price is:",futurePrice,response)
        return new Response(JSON.stringify({
            message:response
        }),{
            status:200,
            headers:{
                'Content-Type': 'application/json'
            }
        })
    }catch (err) {
        console.error("Error Predicting the price of token:", err);
        return new Response(JSON.stringify({ 
            success: false, 
            message: "Error Prediction price of token" 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

