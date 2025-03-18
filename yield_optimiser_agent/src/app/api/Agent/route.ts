import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { AgentRuntime, AmnisStakeTool, AmnisWithdrawStakeTool, AptosGetTokenDetailTool, AptosGetTokenPriceTool, createAptosTools, EchoStakeTokenTool, EchoUnstakeTokenTool, JouleGetPoolDetails, JouleGetUserAllPositions, LiquidSwapSwapTool, PanoraSwapTool, ThalaStakeTokenTool, ThalaUnstakeTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { PortfolioRebalancerTool } from "@/Components/Backend/Tools/PortfolioManager"
import { MemorySaver } from "@langchain/langgraph"
import { HumanMessage } from "@langchain/core/messages"
import { NextRequest, NextResponse } from "next/server"
import { GetUserDiversificationPreferenceTool } from "@/Components/Backend/Tools/PortfolioDiversificationTool"
import { ArbitrageFinderTool } from "@/Components/Backend/Tools/ArbritrageFinder"
import { PricePredictionTool } from "@/Components/Backend/Tools/PricePredictionTool"
import { getPoolDetails } from "@/Components/Backend/Agents/PoolDetailsAgent"
import { AptosBalanceTool, AptosAccountAddressTool } from "move-agent-kit"
import { GetBestYieldingOppurtunityTool } from "@/Components/Backend/Tools/BestYieldAgent"
import { FetchTokenPriceInUsdTool } from "@/Components/Backend/Tools/FetchTokenPriceTool"
import { Find24HChangeTool } from "@/Components/Backend/Tools/VolatilityTool"
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
				new AptosBalanceTool(agentRuntime),
				GetUserDiversificationPreferenceTool,
				ArbitrageFinderTool,
				PricePredictionTool,
				new JouleGetPoolDetails(agentRuntime),
				GetBestYieldingOppurtunityTool,
				new AptosAccountAddressTool(agentRuntime),
				FetchTokenPriceInUsdTool,
				Find24HChangeTool,
				new LiquidSwapSwapTool(agentRuntime),
				new JouleGetUserAllPositions(agentRuntime),
				new EchoStakeTokenTool(agentRuntime),
				new EchoUnstakeTokenTool(agentRuntime),
				new ThalaStakeTokenTool(agentRuntime),
				new ThalaUnstakeTokenTool(agentRuntime),
				new AmnisStakeTool(agentRuntime),
			    new AmnisWithdrawStakeTool(agentRuntime)
			],
			checkpointSaver: memory5,
			messageModifier: `
  You are an intelligent on-chain agent that interacts with the Aptos blockchain via the Aptos Agent Kit. Your capabilities include fetching token details, checking prices, identifying arbitrage opportunities, rebalancing portfolios, predicting prices, and retrieving pool details using specialized tools.
  - Use the appropriate tool for a query when required and specify the tool's name in your response.
  - If no tool exists for a requested action, inform the user and suggest creating it with the Aptos Agent Kit.
  - For internal (5XX) HTTP errors, advise the user to retry later.
  - Provide concise, accurate, and helpful responses, avoiding tool details unless asked.
  - When the price prediction tool is used, alos fetch the current price of that token and then give the percentage change also of that particular token only using the . If the change is more than -5% ask the user to swap their token to stable because the token may decrease more and if its positive ask the user to hold the token.
  - If user specifically tells you to predict the price of a token then only call PricePredictionTool.
  - If user asks for 24Change or % change of a token call the  Find24HChangeTool.
  - If a Transaction is being sent wait for the transaction to be completed and then return the hash of the transaction.
  Response Format:Strictly follow this response format dont add any other component to this response  but inside the response string add proper \n characters for better visibility
  {
    "agentResponse":"Your simplified response as a string",
    "toolCalled": "Tool name or null if none used"
  }
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
	  
	  let answer;
       try {
         answer = JSON.parse(response[finalLength - 1].content);
		 console.log(answer)
       } catch (error) {
         console.error("JSON parsing error:", error);
         answer = response[finalLength - 1].content; 
		 console.log(answer)
       }
	   return NextResponse.json({
		data:answer || "I am really sorry we couldn't process your request at the moment. \n Please Try Again Later",
		agentResponse:true
	   })
	} catch (error) {
	  console.error("Agent execution error:", error);
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  
