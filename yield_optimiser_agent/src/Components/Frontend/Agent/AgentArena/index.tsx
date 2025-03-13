import { useCallback, useState, useEffect, act } from "react";
import "./styles.scss";
import { useRef } from "react";
import { AiOutlineEnter } from "react-icons/ai";
import { useShallow } from "zustand/react/shallow";
//import { convertBigIntToUIFormat } from "@/utils/number";
import axios from "axios"
import { useAgentStore } from "@/store/agent-store";
import { CustomTextLoader } from "@/Components/Backend /Common/CustomTextLoader";
import Image from "next/image";
import { DAPP_LOGO } from "@/Components/Backend /Common/Constants";
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
        console.log(data)
        const response:string=data.agentResponse[0].content;
        useAgentStore.getState().setActiveResponse(response)
      } catch (error) {
        console.error("Error processing agent response:", error);
      }
    }
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
      {response.split("\n").map((line, index) => (
        <p key={index}>{line}</p>
      ))}
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
  // const chatArray= (activeResponse.quote==="" && activeResponse.outputString==="") ? response : response.slice(0,-1) ;
  return (
    <div className="ArenaChatArea">
      <div className="ArenaChatBox" ref={chatBoxRef}>
     {/* { 
      chatArray.map((item)=>{
      const agentResponse:Response={
        quote:item.quote,
        outputString:item.outputString,
        toolCalled:item.toolCalled
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
          renderText(agentResponse)
        }
      </div>
        </>
      )
     })
      } */}
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