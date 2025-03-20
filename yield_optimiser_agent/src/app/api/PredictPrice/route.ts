import { NextRequest, NextResponse } from "next/server";
import { PredictNextDayPrice } from "@/Components/Backend/Tools/PricePredictionTool";
import { InitializeAgent } from "../Agent/route";
import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { MemorySaver } from "@langchain/langgraph";
import { AgentRuntime, AptosGetTokenPriceTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { fetchSupportedTokens, fetchTokenPriceInUsd } from "@/Components/Backend/Common/Token";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
config()

export async function GET(request: NextRequest) {
	try {
         const tokenName = request.nextUrl.searchParams.get("tokenName");
		 console.log(tokenName)
		 console.log(await fetchSupportedTokens())
		 const token=(await fetchSupportedTokens()).filter((item)=>item.name.toLowerCase()===tokenName?.toLowerCase())[0]
		 console.log(token)
         const predictedPrice=await PredictNextDayPrice(tokenName?.toLowerCase() || "usdc")
		 const initializedAgent=await InitializeAgent();
		 const tokenPriceUsd = await fetchTokenPriceInUsd(token.token_address);
		 const model=initializedAgent?.agent
		 if(model===undefined){
			return NextResponse.json({
				data:predictedPrice,
				agentResponse:false
			})
		 }else{
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
		   
			const agent = createReactAgent({
				llm,
				tools:[
					new AptosGetTokenPriceTool(agentRuntime),
				],
				checkpointSaver: memory5,
				messageModifier: `
				You are an expert DEFI Analyst Agent specializing in cryptocurrency market analysis and investment recommendations. Your purpose is to provide valuable insights on token performance, price predictions, and trading strategies.
When responding:
- Present information in a professional, structured format with proper line breaks
- Do not mention which tools you used to gather information
- Do not use emojis in your responses
- Ensure all text flows as a continuous, well-formatted string
- Include relevant metrics like percentage changes,and  risk assessments
- When discussing declining tokens, recommend consideration of stablecoin options like USDC
- Format numerical data clearly with appropriate decimal places
- Separate sections with line breaks for readability
- Conclude with actionable recommendations based on the analysis
- Remove any emoji and be utmost professional.
				`,
			})
			const response=[];
			const config = { 
				configurable: { 
				  thread_id: `aptos-agent-1` 
				} 
			  };
			const stream = await model.stream(
				{
				  messages: [
					new HumanMessage(`THe current token price is ${tokenPriceUsd}.Give me a summary of the token ${tokenName} with the token predcited price of ${predictedPrice}. Give me the % change in the token and also tell me whether i should buy more of it, if the token price is falling then return the user message to swap their tokens to stablecoin like usdc but don't swap yourself.`),
				  ],
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
			  
			  let answer;
			  const finalLength=response.length;
       try {
         answer = JSON.parse(response[finalLength - 1].content);
       } catch (error) {
         console.error("JSON parsing error:", error);
         answer = response[finalLength - 1].content; 
       }
		   return NextResponse.json({
			data:answer,
			agentResponse:true
		   })
		 }
		 
	} catch (error) {
		console.log(error)
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  