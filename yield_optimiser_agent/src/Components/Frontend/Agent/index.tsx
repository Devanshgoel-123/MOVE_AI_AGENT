"use client"
import React, { act } from "react";
import { ChatBox } from "./AgentChatbox";
import "./styles.scss"
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { AgentArena } from "./AgentArena";
import { Sidebar } from "./SideBar";
import { Portfolio } from "../Portfolio";
import { MarketAnalysisWrapperContainer } from "../MarketAnalysis";
export const ChatAgent=()=>{
    const {
        openArena,
        activeComponent
    }=useAgentStore(useShallow((state)=>({
        openArena:state.openArena,
        activeComponent:state.activeComponent
    })))
    console.log("the active component is:",activeComponent)
       return (
        <div className="AgentUIWrapper">
        <Sidebar/>
        {!openArena ? <div className="ChatBoxWrapper">
            {
                activeComponent==="chat" ? <ChatBox/> : activeComponent==="Market Analysis" ? <MarketAnalysisWrapperContainer/>:<Portfolio/>
            }
        </div>
        :
        <div className="AgentArenaWrapper">
            {
                activeComponent==="chat" ? <AgentArena/> : activeComponent==="Market Analysis" ? <MarketAnalysisWrapperContainer/>:<Portfolio/>
            }
        </div>}
        </div>
       )
}