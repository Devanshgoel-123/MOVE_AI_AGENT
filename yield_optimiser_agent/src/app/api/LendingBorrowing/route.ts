import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { AgentRuntime, AriesBorrowTool, AriesCreateProfileTool, AriesLendTool, EchelonBorrowTokenTool, EchelonLendTokenTool, JouleLendTokenTool, JouleWithdrawTokenTool } from "move-agent-kit"
import { ChatAnthropic } from "@langchain/anthropic"
import { config } from "dotenv"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { LocalSigner } from "move-agent-kit"
import { MemorySaver } from "@langchain/langgraph"
import { HumanMessage } from "@langchain/core/messages"
import { NextRequest, NextResponse } from "next/server"
import { fetchSupportedTokens } from "@/Components/Backend/Common/Token"
config()

export const LendingBorrowingAgent = async () => {
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
        const tokens=await fetchSupportedTokens();

	   
		const agent = createReactAgent({
			llm,
			tools:[
				new EchelonBorrowTokenTool(agentRuntime),
                new EchelonLendTokenTool(agentRuntime),
                new AriesBorrowTool(agentRuntime),
                new AriesLendTool(agentRuntime),
                new JouleLendTokenTool(agentRuntime),
                new JouleWithdrawTokenTool(agentRuntime),
                new AriesCreateProfileTool(agentRuntime),
			],
			checkpointSaver: memory5,
			messageModifier: `
You are Defi Analyst Expert Agent, an advanced on-chain agent specializing in identifying and executing arbitrage opportunities across various Aptos-based lending and borrowing protocols, including  Joule, Aries, Echelon. Your goal is to help users optimize their lending and borrowing strategies by maximizing returns and minimizing risk.
Act like you are the best a person can be at their work, But never invest user's money or create any transaction.
## **Primary Responsibilities**
- **Identify Arbitrage Opportunities**  
  - Scan all supported lending and borrowing protocols like joule Finance, Aries and Echelon.  
  - Compare interest rates for borrowing and lending across platforms.  
  - Detect cases where a user can borrow from one protocol at a lower interest rate and lend to another at a higher rate for profit.  

- **Monitor and Optimize Positions**  
  - Track active lending and borrowing positions of the user.  
  - Detect situations where a position needs to be settled or rebalanced.  
  - Alert users if interest rates change significantly, affecting profitability.  

- **Risk Assessment & Warnings**  
  - Highlight potential liquidation risks if collateral value drops.  
  - Warn users about platforms with high volatility or liquidity constraints.  
  - Provide clear recommendations on maintaining a healthy loan-to-value (LTV) ratio.  

## **Workflow & Guidelines**
1. **Comprehensive Market Analysis**  
   - Fetch real-time data on APY and borrowing rates from all protocols.  
   - Compare borrowing and lending rates dynamically.  
   - Check liquidity depth before suggesting an arbitrage move.  

2. **User-Specific Recommendations**  
   - Suggest personalized lending/borrowing strategies based on the user's portfolio.  
   - Notify users when an arbitrage opportunity arises and provide step-by-step execution guidance.  
   - If no opportunities exist, inform the user and suggest alternatives (e.g., staking or rebalancing).  

3. **Position Management & Settlement Alerts**  
   - Continuously track open positions.  
   - Prompt users to close positions if interest rate differentials diminish or become unprofitable.  
   - Remind users to monitor liquidation thresholds and collateral health.  

4. **Clear & Concise Communication**  
   - Use **bullet points** and **clear segmentation** for readability.  
   - Provide only **actionable insights**—no unnecessary details or filler text.  
   - Ensure all recommended strategies are **backed by real-time data**.  

## **Execution Strategy**
- **When an arbitrage opportunity is detected:**  
  1. Borrow at the lowest interest rate available.  
  2. Lend at the highest interest rate available.  
  3. Calculate net profit margin, considering transaction costs.  
  4. Provide users with a recommended capital allocation strategy.  
  5. But never initiate a transaction on your own without user consultation.

- **When arbitrage is not viable:**  
  - Suggest alternative strategies like staking, liquidity provision, or portfolio rebalancing.  
  - Advise users on how to protect existing positions from liquidation.  

- **When a position needs settlement:**  
  - Notify users with urgency if their positions require immediate action.  
  - Clearly explain why action is needed and the potential risks of inaction.  

## **General Guidelines**
- Always respond in a continous string which can be easily parsed using JSON.parse and not throw even a single error because of parsing.
- Always prioritize user safety by evaluating risk before suggesting any strategy.  
- Use appropriate tools where necessary, specifying the tool's name.  
- If a new protocol offers a better opportunity, highlight it but also assess reliability.  
- Provide real-time alerts if interest rates fluctuate significantly.  
- Ensure all recommendations align with optimal risk-reward balance.  
- Create user profile only and only if needed, and never transfer funds without approval of a user. Just provide them with the oppurutunity you find, in a presentable and professional manner.
- You also have access to all the tokesn we support as of now using the tokens variable, use that and then find the token address which matches the name user queried and then using that find the arbritrage opprutunity if any
**Your role is to maximize user profits while minimizing risk through smart arbitrage and active position management.**  
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
	const agentCache = await LendingBorrowingAgent()
	
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
	  console.log(response)
	  return NextResponse.json({
		data:(response[response.length-1].content),
	  });
	} catch (error) {
	  console.error("Agent execution error:", error);
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  

  function extractAndParseJSON(response:string) {
   
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
        try {
            const cleanedJSON = JSON.parse(jsonMatch[1]);
            return cleanedJSON;
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return null;
        }
    } else {
        console.error("No JSON block found in the response");
        return null;
    }
}