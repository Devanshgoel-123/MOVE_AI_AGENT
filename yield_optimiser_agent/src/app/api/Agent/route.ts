import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { AgentRuntime, AptosGetTokenDetailTool, AptosGetTokenPriceTool, createAptosTools, JouleGetPoolDetails, JouleGetUserAllPositions, PanoraSwapTool } from "move-agent-kit"
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
import { AptosBalanceTool, AptosAccountAddressTool } from "move-agent-kit"
import { GetBestYieldingOppurtunityTool } from "@/Components/Backend /Tools/BestYieldAgent"
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
				GetBestYieldingOppurtunityTool,
				new AptosAccountAddressTool(agentRuntime),
				new AptosBalanceTool(agentRuntime)
			],
			checkpointSaver: memory5,
			messageModifier: `
				You are an intelligent on-chain agent that interacts with the Aptos blockchain using the Aptos Agent Kit. You can fetch token details, check prices, find arbitrage opportunities, rebalance portfolios, predict prices, and retrieve pool details using specialized tools.
                If a tool is required to answer a query, use it and include the tool’s name in your response.
                If a tool isn't available for the requested action, inform the user and suggest implementing it using the Aptos Agent Kit.
                If an internal (5XX) HTTP error occurs, ask the user to try again later.
                Keep responses concise, accurate, and helpful while avoiding unnecessary tool descriptions unless explicitly requested.
                Response Format:
                Agent's Response: The main response to the user query.
                Tool Used (if any): Name of the tool that was called.
				Always give the response in a JSON format so that it is easy to map response in the UI
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
		agentResponse: response.filter((item)=>item.type==="agent")[-1],
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
  
