import { ACCOUNT_ADDRESS } from "@/Components/Backend/Common/Constants";
import { fetchSupportedTokens, getTokenAmountOwnedByAccount } from "@/Components/Backend/Common/Token";
import { FindAndExecuteArbritrageOppurtunity } from "@/Components/Backend/Tools/ArbritrageFinder";
import { PredictNextDayPrice } from "@/Components/Backend/Tools/PricePredictionTool";
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
        const futurePrice=await Promise.all(tokenName.map(name => PredictNextDayPrice(name)))
        console.log("the future price is:",futurePrice)
        return new Response(JSON.stringify({
            message:futurePrice
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


const Agent=async()=>{
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
   
    const PricePredictoragent = createReactAgent({
        llm,
        tools:[
            PortfolioRebalancerTool,
            new PanoraSwapTool(agentRuntime),
            FetchTokenPriceInUsdTool,
            new LiquidSwapSwapTool(agentRuntime),
        ],
        checkpointSaver: memory5,
        messageModifier: ``,
    })
}