import { InitializeAgent } from "@/app/api/Agent/route";
import { fetchJouleFinanceYields } from "../Agents/JouleFinanceAgent";
import { fetchThalaSwapYields } from "../Agents/ThalaAgent";
import { extractJsonFromResponse } from "@/Utils/function";
import { HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { SystemMessage } from "@langchain/core/messages";
import Zod from "zod";
/**
   * Find the best yield opportunity based on parameters
   * @returns Best opportunity with detailed analysis
   */
 export const findBestOpportunity=async(tokenName:string)=>{
    // const tokenName="aptos"
    const InitializedAgent=await InitializeAgent();
    const agent=InitializedAgent?.agent;    
    try {
        const riskTolerance = 5;
        const minLiquidity = 100000;
        const maxLockupPeriod = 365;
      const [joulePools] = await Promise.all([
         fetchJouleFinanceYields(tokenName),
      ]);
      
      if (joulePools.error) {
        return {
          error: "Failed to fetch complete pool data",
          jouleError: joulePools.error,
        };
      }
      const allPools = {
        joulePools: Array.isArray(joulePools) ? joulePools : [],
      };
      
      const bestOpportunity = await analyzePools(allPools, {
        agent,
        riskTolerance,
        minLiquidity,
        maxLockupPeriod
      });
      console.log("the best oppurtunity is:",joulePools)
      return {
        bestOpportunity,
        allPools,
        parameters: {
          riskTolerance:riskTolerance,
          minLiquidity: minLiquidity,
          maxLockupPeriod: maxLockupPeriod
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error finding best opportunity:", error);
      return { error: `Failed to find best opportunity: ${error}` };
    }
  }
  
  /**
   * Analyze pools to find the best opportunity
   * @param allPools Combined pool data from both protocols
   * @returns Best opportunity with detailed analysis
   */
  export const  analyzePools= async (allPools: { joulePools: any[]}, options: {
    agent: any,
    riskTolerance?: number,
    minLiquidity?: number,
    maxLockupPeriod?: number
  })=>{
    
    try {
      const config = {
        configurable: {
          thread_id: `yield-opportunity-analyzer`
        }
      };
      const {
        agent,
        riskTolerance = 5,
        minLiquidity = 100000,
        maxLockupPeriod = 365
      } = options;
    
      
      const response = [];
      const systemPrompt = 
        "You are a DeFi yield analysis expert. Analyze the provided pool data and identify the best investment opportunity based on the given parameters. Consider:" +
        "\n- Risk-adjusted returns (not just highest APY)" +
        "\n- Protocol security and history" +
        "\n- Liquidity and TVL requirements" +
        "\n- User's token preferences and exclusions" +
        "\n- Lockup period constraints" +
        "\n- Historical stability and impermanent loss potential" +
        "\nProvide a detailed analysis of why this is the best opportunity along with specific implementation instructions.";
      
        const parametersDescription = `
        Analysis Parameters:
        - Risk Tolerance: ${riskTolerance}/10 (higher = more risk tolerance)
        - Minimum Liquidity/TVL: $${minLiquidity.toLocaleString()} USD
        - Maximum Lockup Period: ${maxLockupPeriod} days
        `;
      
      const stream = await agent.stream(
        {
          messages: [
            new SystemMessage(systemPrompt),
            new HumanMessage(`Analyze these DeFi pools and identify the best yield opportunity based on my parameters:
              
${JSON.stringify(allPools, null, 2)}

${parametersDescription}

Provide:
1. The single best opportunity with protocol name, pool name, and tokens
2. Expected APY/APR with breakdown of sources
3. Risk assessment and consideration
4. Step-by-step investment instructions
5. Monitoring recommendations
6. Exit strategy guidelines
`)
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
      
      // Try to extract structured data, but keep full analysis text as well
      const structuredData = extractJsonFromResponse(response);
      
      return {
        structuredRecommendation: structuredData,
        fullAnalysis: response.map(item => item.content).join("\n")
      };
    } catch (error) {
      console.error("Error analyzing pools:", error);
      return { error: `Failed to analyze pools: ${error}` };
    }
  }
  


  export const GetBestYieldingOppurtunityTool= tool(
    async ({ tokenName }) => {
        try {
            const result = await findBestOpportunity(tokenName);
            console.log("the final result is",result)
            return {
              success: true,
              data: result
            };
          } catch (error) {
            console.error("Error finding best yield opportunity:", error);
            return {
              success: false,
              message: `Error finding best yield opportunity: ${error instanceof Error ? error.message : String(error)}`
            };
          }
    },
    {
      name: "GetBestYieldOppurtunityTool",
      description: "Fetches the best yielding oppurtunity for the a particular token based on user's query",
      schema: Zod.object({
        tokenName: Zod.string().describe("The token Name of the token To find best yield oppurtunity for")
      })
    }
  );
  