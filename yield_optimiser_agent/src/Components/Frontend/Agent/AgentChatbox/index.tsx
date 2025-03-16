import "./styles.scss"
import { ReadyToClickActionButton } from "./ButtonContainer"
import {useRef } from "react"
import { AiOutlineEnter } from "react-icons/ai";
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { useMediaQuery } from "@mui/material"
import axios from "axios";
interface Props{
  heading:string;
  content:string;
  query:string;
}

export const ChatBox=()=>{
  const isMdDevice= useMediaQuery("(max-width:768px)");
    const {
      activeChat,
      chatId
    }=useAgentStore(useShallow((state)=>({
      activeChat:state.activeChat,
      chatId:state.activeChatId
    })))
    const userInputRef = useRef<HTMLInputElement>(null);
    const handleKeyPress =  (e:React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && userInputRef.current) {
          const userInput = userInputRef.current?.value;
          if (userInput.trim()) {
             handleEnterClick()
            userInputRef.current.value = ""; 
          }
        }
      };
    
    const handleEnterClick=async ()=>{
        userInputRef.current?.value!==null && useAgentStore.getState().setActiveChat( userInputRef.current?.value as string)
        useAgentStore.getState().setActiveResponse("")
        useAgentStore.getState().handleOpenArena()
        try{
          const {data}=await axios.post("/api/Agent",{
            message:userInputRef.current?.value,
            chatId:chatId
          })
          console.log(data.agentResponse)
          const response:string=data.agentResponse;
          useAgentStore.getState().setActiveResponse(response)
        } catch (error) {
          console.error("Error processing agent response:", error);
        }
        
    }  

    const ButtonContent:Props[]=[
      {
        heading:"Predict Price",
        content:"Predict the price of Any Supported Token on Aptos",
        query:"Predict the price of token"
      },
      {
        heading:"Fetch Token Price",
        content:"Fetch Token Price of a token in USD",
        query:"Fetch the token price"
      },
      {
        heading:"Yield Farm",
        content:"Fetch The Yield Farming Oppurtunity for a token",
        query:"Fetch the Yield Farming Oppurtunity For a Token"
      },
      {
        heading:"Swap",
        content:"Swap one token to Another",
        query:"Swap token"
      }
    ]
    return (
        <div className="ChatBox">
            <div className="ChatHeader">
            <span>How can we help you today ?</span>
            <span>We are here to help you out in every step of the way</span>
        </div> 
        <div className="AllButton">
        <div className="ButtonsWrapper">
          {
            ButtonContent.slice(0,2).map((item:Props,index:number)=>{
              return <ReadyToClickActionButton content={item.content} heading={item.heading} key={index} query={item.query}/>
            })
          }
        </div>
        <div className="ButtonsWrapper">
          {
            ButtonContent.slice(2).map((item:Props,index:number)=>{
              return <ReadyToClickActionButton content={item.content} heading={item.heading} key={index} query={item.query}/>
            })
          }
        </div>
        </div>
       
        <div className="AgentInputContainer">
        <input
             ref={userInputRef}
             onKeyDown={handleKeyPress}
            placeholder="Ask Anything"
            className="AgentInput"
          />
          <div 
        className="EnterButton"
        onClick={handleEnterClick}
        >
        <AiOutlineEnter />
        </div>
        </div>
        </div>
           
    )
}