
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
        chatId
    }=useAgentStore(useShallow((state)=>({
        chatId:state.activeChatId
    })))
    const handleClick=async()=>{
        useAgentStore.getState().handleOpenArena()
        useAgentStore.getState().setActiveChat(query)
        try{
            const {data}=await axios.post(`${BACKEND_URL}/lendingBorrow/usdc`,{
                message:query,
                chatId:chatId
              })
              const response:string=FormatDisplayTextForChat(data.data.agentResponse);

              useAgentStore.getState().setActiveResponse(response)
        } catch (error) {
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