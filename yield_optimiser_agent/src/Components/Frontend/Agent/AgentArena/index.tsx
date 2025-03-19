import { useCallback, useState, useEffect, act } from "react";
import "./styles.scss";
import { useRef } from "react";
import { AiOutlineEnter } from "react-icons/ai";
import { useShallow } from "zustand/react/shallow";
//import { convertBigIntToUIFormat } from "@/utils/number";
import axios from "axios"
import { useAgentStore } from "@/store/agent-store";
import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader";
import Image from "next/image";
import { DAPP_LOGO } from "@/Components/Backend/Common/Constants";
import { AgentChat } from "@/store/agent-store";
export const AgentArena = () => {
  const chatBoxRef=useRef<HTMLDivElement>(null);
 
  const { 
    activeChat, 
    activeResponse,
    agentResponses,
    chatId,
  } = useAgentStore(useShallow((state) => ({
    activeChat: state.activeChat,
    activeResponse: state.activeResponse,
    agentResponses:state.agentResponses,
    chatId:state.activeChatId,
  })));

    console.log("the chat id is",chatId)

  useEffect(()=>{
    if(chatBoxRef.current){
      chatBoxRef.current.scrollTop=chatBoxRef.current.scrollHeight
    }
  },[activeChat,activeResponse])

  const userInputRef = useRef<HTMLInputElement>(null);


  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && userInputRef.current) {
      const userInput = userInputRef.current?.value;
      if (userInput.trim()) {
      handleEnterClick();
        userInputRef.current.value = "";
      }
    }
  };

  const handleEnterClick = async () => {
    if (userInputRef.current?.value) {
      useAgentStore.getState().setActiveChat(userInputRef.current.value);
      useAgentStore.getState().setActiveResponse("")
      try {
        const {data}=await axios.post("/api/Agent",{
          message:userInputRef.current?.value,
          chatId:chatId
        })
        console.log(data.data)
        const response:string=data.data.agentResponse;
        useAgentStore.getState().setActiveResponse(response)
        useAgentStore.getState().setAgentResponses({
          query:activeChat,
          outputString:response,
          chatId:chatId
        })
      } catch (error) {
        useAgentStore.getState().setActiveResponse("I am sorry, We couldn't process your request at the moment.")
        useAgentStore.getState().setAgentResponses({
          query:activeChat,
          outputString:"I am sorry, We couldn't process your request at the moment.",
          chatId:chatId
        })
        console.error("Error processing agent response:", error);
      }
    }
    return
  };
  

  const renderText=(response:string)=>{
   if (response==="") return <CustomTextLoader text="Loading" />;
   const renderGeneralToolResponse=(answer:string)=>{
    return (
      <div className="SwapBox">
        <div className="Logo">
       <Image src={DAPP_LOGO} height={30} width={30} alt="chatlogo"/>
      </div>
      <div className="SwapSummary">
      <div className="nestedResponse">
      <span className="responseRow">
      {answer.split('\n').map((item,index)=>{
        console.log(item)
        return <div key={index} className="itemResponse">
        {item}
        <br />
      </div>
      })}
      </span>
      </div>
      </div>
     </div>)
  }
      return (
      !response || response===undefined ? <div className="nestedResponse">
         <div className="Logo">
            <Image src={DAPP_LOGO} height={30} width={30} alt="chatlogo"/>
           </div>
         <span className="responseRow"> {
         "Sorry we Couldn't process your request at the moment"
        }</span>
    </div>
    :
    renderGeneralToolResponse(response)
    )
  }
   const chatArray= agentResponses.length>0 ? agentResponses : [];
   console.log(chatArray)
  return (
    <div className="ArenaChatArea">
      <div className="ArenaChatBox" ref={chatBoxRef}>
     { 
      chatArray.length>1 ? 
      chatArray.slice(0,activeResponse!==""? chatArray.length-1 : chatArray.length).map((item)=>{
      const agentResponse:AgentChat={
        query:item.query,
        outputString:item.outputString,
        toolCalled:item.toolCalled,
        chatId:item.chatId
      }
      return (
        <>
        <div className="chatTextQuestion">
        <div className="chatText">
          <span>{item.query}</span>
        </div>
      </div>
      <div className="chatTextResponse">
        {
          renderText(agentResponse.outputString)
        }
      </div>
        </>
      )
     }):null
      }
      {activeChat!=="" && <div className="chatTextQuestion">
        <div className="chatText">
          <span>{activeChat}</span>
        </div>
      </div>}
     { (activeResponse==="" && activeChat==="") ? 
    null
     :<div className="chatTextResponse">
        {
          renderText(activeResponse)
        }
      </div>
      }
    </div>
    <div className="AgentArenaInputContainer">
     <input
       ref={userInputRef}
       onKeyDown={handleKeyPress}
       placeholder="Ask Anything"
       className="AgentInput"
     />
     <div className="EnterButton" onClick={handleEnterClick}>
       <AiOutlineEnter />
     </div>
   </div>
    </div>
   
    
  );
};