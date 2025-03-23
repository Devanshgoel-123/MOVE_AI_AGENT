"use client";
import React, { act, use } from "react";
import { ChatBox } from "./AgentChatbox";
import "./styles.scss";
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { AgentArena } from "./AgentArena";
import { Sidebar } from "./SideBar";
import { BsLayoutTextSidebar } from "react-icons/bs";
import { Portfolio } from "../Portfolio";
import { MarketAnalysisWrapperContainer } from "../MarketAnalysis";
import { useMediaQuery } from "@mui/material";
import YieldFarm from "../YieldFarm";
export const ChatAgent = () => {
  const { openArena, activeComponent } = useAgentStore(
    useShallow((state) => ({
      openArena: state.openArena,
      activeComponent: state.activeComponent,
    }))
  );
  const MobileDevice = useMediaQuery("(max-width:600px)");
  console.log("the active component is:", activeComponent);
  return (
    <div className="AgentUIWrapper">
      <Sidebar />
      {/* { MobileDevice &&  <div className="SideBarIcon" onClick={()=>{
            useAgentStore.getState().setOpenSideBar(true)
        }}>
        <BsLayoutTextSidebar />
        </div>} */}
      {!openArena ? (
        <div className="ChatBoxWrapper">
          {
            //  activeComponent==="chat" ? <ChatBox/> : activeComponent==="Market Analysis" ? <MarketAnalysisWrapperContainer/>:<Portfolio/>
            <YieldFarm />
          }
        </div>
      ) : (
        <div className="AgentArenaWrapper">
          {activeComponent === "chat" ? (
            <AgentArena />
          ) : activeComponent === "Market Analysis" ? (
            <MarketAnalysisWrapperContainer />
          ) : (
            <Portfolio />
          )}
        </div>
      )}
    </div>
  );
};
