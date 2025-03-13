import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { AgentRuntime, AptosGetTokenDetailTool, AptosGetTokenPriceTool, createAptosTools, JouleGetPoolDetails, PanoraSwapTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { PortfolioRebalancerTool } from "@/Components/Backend /Tools/PortfolioManager"
import { MemorySaver } from "@langchain/langgraph"
import { HumanMessage } from "@langchain/core/messages"
import { NextRequest, NextResponse } from "next/server"
import { GetUserDiversificationPreferenceTool } from "@/Components/Backend /Tools/PortfolioDiversificationTool"
import { ArbitrageFinderTool } from "@/Components/Backend /Tools/ArbritrageFinder"
import { PricePredictionTool } from "@/Components/Backend /Tools/PricePredictionTool"
import { getPoolDetails } from "@/Components/Backend /Agents/PoolDetailsAgent"
config()

export const InitializeAgent = async () => {
	try{
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
				PortfolioRebalancerTool,
				new PanoraSwapTool(agentRuntime),
				new AptosGetTokenDetailTool(agentRuntime),
				new AptosGetTokenPriceTool(agentRuntime),
				GetUserDiversificationPreferenceTool,
				ArbitrageFinderTool,
				PricePredictionTool,
				new JouleGetPoolDetails(agentRuntime),
			],
			checkpointSaver: memory5,
			messageModifier: `
				You are a helpful agent that can interact onchain using the Aptos Agent Kit. You are
				empowered to interact onchain using your tools. If you ever need funds, you can request them from the
				faucet. If not, you can provide your wallet details and request funds from the user. If there is a 5XX
				(internal) HTTP error code, ask the user to try again later. If someone asks you to do something you
				can't do with your currently available tools, you must say so, and encourage them to implement it
				themselves using the Aptos Agent Kit, recommend they go to https://www.aptosagentkit.xyz for more information. Be
				concise and helpful with your responses. Refrain from restating your tools' descriptions unless it is explicitly requested.
				The input json should be string (IMPORTANT)
			`,
		})
		return { agent, account, agentRuntime };
	}catch(err){
		console.log(err)
		return null
	}	
}


export async function POST(request: NextRequest) {
	try {
	const agentCache = await InitializeAgent()
	
	  if(agentCache===null){
		return {
			message:"Failed to answer your query"
		}
	  }
	  const { agent, account } = agentCache;
	  const body = await request.json();
	  
	  const { message } = body;
	  console.log("the message is:",message)
	  getPoolDetails()
	  if (!message) {
		return NextResponse.json(
		  { error: "Message is required" },
		  { status: 400 }
		);
	  }
	  const config = { 
		configurable: { 
		  thread_id: `aptos-agent-1` 
		} 
	  };
	  const response = [];
	  
	  const stream = await agent.stream(
		{
		  messages: [new HumanMessage(message)],
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
      const finalLength=response.length;
	  console.log(response)
	  return NextResponse.json({
		agentResponse: response.filter((item)=>item.type==="agent"),
		accountAddress: account.accountAddress.toString()
	  });
	} catch (error) {
	  console.error("Agent execution error:", error);
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  
