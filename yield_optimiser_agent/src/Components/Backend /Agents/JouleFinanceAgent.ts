import { InitializeAgent } from "@/app/api/Agent/route";
import { HumanMessage } from "@langchain/core/messages";
import { SystemMessage } from "@langchain/core/messages";
import { JouleGetPoolDetails } from "move-agent-kit";
import { extractJsonFromResponse } from "@/Utils/function";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
	Aptos,
	AptosConfig,
	Ed25519PrivateKey,
	HexInput,
	Network,
	PrivateKey,
	PrivateKeyVariants,
} from "@aptos-labs/ts-sdk"
import { LocalSigner } from "move-agent-kit";
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentRuntime } from "move-agent-kit";
import { MemorySaver } from "@langchain/langgraph"
import dotenv from "dotenv";
dotenv.config()

/**
 * Fetches yield opportunities from Joule Finance
 * @returns Array of yield opportunities with APY, risk, and other details
 */
export const fetchJouleFinanceYields = async (tokenName:string) => {
    try {
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
				new JouleGetPoolDetails(agentRuntime),
			],
			checkpointSaver: memory5,
			messageModifier:
            `You are a DeFi data specialist focused on Joule Finance. Provide a structured list of all current yield opportunities on Joule Finance for the token ${tokenName} with the following details:`+
            "\n- Pool name" +
            "\n- Current APY/APR" +
            "\n- Token composition" +
            "\n- Minimum investment amount" +
            "\n- Lock-up period (if any)" +
            "\n- Total Value Locked (TVL)" +
            "\nFormat the data as a JSON array for programmatic processing.",
		})
      if (agent === undefined) {
        console.error("Failed to initialize agent");
        return null;
      }
      
      const config = {
        configurable: {
          thread_id: `joule-finance-yields`
        }
      };
      
      const response = [];
    
      
      const stream = await agent.stream(
        {
          messages: [
            new HumanMessage(`List all current yield farming opportunities on Joule Finance with their APYs and details for the token ${tokenName}.`)
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
      
      // Parse the response to extract JSON data
      const jsonData = extractJsonFromResponse(response);
      return jsonData || response;
    } catch (error) {
      console.error("Error fetching Joule Finance yields:", error);
      return null;
    }
  };
  
//s a DeFi yield farming expert, analyze these opportunities:

// ${JSON.stringify(strategies, null, 2)}

// Current market context:
// ${marketContext}

// Please provide:
// 1. Best strategy recommendation considering risk-adjusted returns
// 2. Detailed risk assessment for each strategy
// 3. Step-by-step implementation instructions
// 4. Market timing considerations
// 5. Gas cost considerations and break-even analysis

// Focus on safety and sustainable yields rather than just highest APY.

