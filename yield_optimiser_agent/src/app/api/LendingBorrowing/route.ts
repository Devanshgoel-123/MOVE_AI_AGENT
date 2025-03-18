
import { config } from "dotenv"
import { HumanMessage } from "@langchain/core/messages"
import { NextRequest, NextResponse } from "next/server"
import { LendingBorrowingAgent } from "@/Components/Backend/Agents/LendBorrowAgent"
config()


export async function POST(request: NextRequest) {
	try {
	const agentCache = await LendingBorrowingAgent()
	
	  if(agentCache===null){
		return NextResponse.json(
			{ error: "Failed to answer your query" },
			{ status: 500 }
		);
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
		data:JSON.parse(response[response.length-1].content),
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