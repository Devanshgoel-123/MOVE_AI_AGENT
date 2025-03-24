
import { useAgentStore } from "@/store/agent-store";
import "./styles.scss"
import { FaBalanceScale } from "react-icons/fa";
import axios from "axios"
import { useAccount } from "wagmi";
import { useShallow } from "zustand/react/shallow";
import { BACKEND_URL } from "@/Components/Backend/Common/Constants";
import { FormatDisplayTextForChat } from "@/Utils/function";
interface Props{
    heading:string;
    content:string;
    query:string;
}
export const ReadyToClickActionButton=({
    heading,
   content,
   query
}:Props)=>{
    const {
        chatId,
        agentWalletAddress,
        agentKey
    }=useAgentStore(useShallow((state)=>({
        chatId:state.activeChatId,
        agentWalletAddress:state.agentWalletAddress,
        agentKey:state.agentKey
    })))
    const handleClick=async()=>{
        useAgentStore.getState().handleOpenArena()
        useAgentStore.getState().setActiveChat(query)
        try{
            const {data}=await axios.post(`${BACKEND_URL}/agent`,{
                message:query,
                chatId:chatId,
                agentWalletAddress:agentWalletAddress,
                agentKey:agentKey
              })
              const response:string=FormatDisplayTextForChat(data.data.agentResponse);
              useAgentStore.getState().setActiveResponse(response)
              useAgentStore.getState().setAgentResponses({
                query: query,
                outputString:data.data.agentResponse,
                chatId: chatId,
              });
        } catch (error:any) {
            useAgentStore.getState().setActiveResponse("We couldn't Process your request at the moment. Please Fund Your Wallet to proceed")
            useAgentStore.getState().setAgentResponses({
                query: query,
                outputString:"We couldn't Process your request at the moment. Please Fund Your Wallet to proceed",
                chatId: chatId,
              });
              console.error("Error processing agent response:", error);
        }
    }
    return (
        <div className="ButtonContainer" onClick={handleClick}>
            <div className="ButtonHeading">
                <FaBalanceScale />
                <span>{heading}</span>
            </div>
            <span className="ButtonInfo">{content}</span>
        </div>
    )
}