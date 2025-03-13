"use client"
import React from "react";
import { ChatBox } from "./AgentChatbox";
import "./styles.scss"
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { AgentArena } from "./AgentArena";
import { Sidebar } from "./SideBar";
export const ChatAgent=()=>{
    const {
        openArena
    }=useAgentStore(useShallow((state)=>({
        openArena:state.openArena
    })))
       return (
        <div className="AgentUIWrapper">
        <Sidebar/>
        {!openArena ? <div className="ChatBoxWrapper">
            <ChatBox/>
        </div>
        :
        <div className="AgentArenaWrapper">
            <AgentArena/>
        </div>}
        </div>
       )
}