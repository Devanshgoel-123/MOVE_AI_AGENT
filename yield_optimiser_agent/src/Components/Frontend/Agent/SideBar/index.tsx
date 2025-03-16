import React from "react";
import { useState,useEffect, } from "react";
import { Box } from "@mui/material";
import Image from "next/image";
import { BsChatDotsFill } from "react-icons/bs";
import { SocialComponent } from "./Social";
import "./styles.scss";
import { IoMdAdd } from "react-icons/io";
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { MessageSquare, BarChart3, PieChart, Compass, Wallet, FileText, Settings, HelpCircle } from 'lucide-react';
import { useMediaQuery } from "@mui/material"
import { DAPP_LOGO } from "@/Components/Backend /Common/Constants";

export const Sidebar=()=>{
    const isXxlDevice=useMediaQuery("(min-width: 1280px)");
    const isXlDevice = useMediaQuery("(min-width: 1024px) and (max-width: 1279px)")
    const {
        openArena
    }=useAgentStore(useShallow((state)=>({
        openArena:state.openArena
    })))

    const renderChatSummary=()=>{
        const charLimit = isXxlDevice ? 30 : isXlDevice ? 25 : 20;
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const startOfSevenDays = new Date(yesterday);
        startOfSevenDays.setDate(yesterday.getDate() - 6); 
        // const todayChats = userChatSummary.filter((item: UserChatSummary) => {
        //   const chatDate = new Date(item.firstMessageDate * 1000);
        //   return chatDate >= today;
        // });
        // const yesterdayChats = userChatSummary.filter((item: UserChatSummary) => {
        //   const chatDate = new Date(item.firstMessageDate * 1000);
        //   return chatDate >= yesterday && chatDate < today;
        // });
        // const pastSevenDayChats = userChatSummary.filter((item: UserChatSummary) => {
        //   const chatDate = new Date(item.firstMessageDate * 1000);
        //   return chatDate >= startOfSevenDays && chatDate < yesterday;
        // });
        return (
            <div className="ChatHistorySideBar">
            {/* {todayChats.length > 0 && <div className="PastChats">
            <span>Today</span>
               {
                todayChats.slice(0,4).map((item)=>{
                    return (
                        <span key={item.firstMessageDate} className="chatSummary" onClick={()=>{
                            useAgentStore.getState().handleOpenArena();
                            useAgentStore.setState({
                                activeChatId:item.chatId
                            })
                        }}>
                            {item.user_query.slice(0, 1).toUpperCase() +
                item.user_query.slice(1, charLimit).toLowerCase() +
                (item.user_query.length > charLimit ? "..." : "")}
                        </span>
                    )
                })
               }
            </div>}
           { yesterdayChats.length>0 && 
            <div className="PastChats">
            <span>Yesterday</span>
               {
                yesterdayChats.slice(0,4).map((item)=>{
                    return (
                        <span key={item.firstMessageDate} className="chatSummary" onClick={()=>{
                            useAgentStore.getState().handleOpenArena();
                            useAgentStore.setState({
                                activeChatId:item.chatId
                            })
                        }}>
                            {item.user_query.slice(0, 1).toUpperCase() +
                  item.user_query.slice(1, charLimit).toLowerCase() +
                  (item.user_query.length > charLimit ? "..." : "")}
                        </span>
                    )
                })
               }
            </div>
            }
            {pastSevenDayChats.length>0 &&
            <div className="PastChats">
            <span>Past 7 Days</span>
               {
                pastSevenDayChats.slice(0,4).map((item)=>{
                    return (
                        <span key={item.firstMessageDate} className="chatSummary" onClick={()=>{
                            useAgentStore.getState().handleOpenArena();
                            useAgentStore.setState({
                                activeChatId:item.chatId
                            })
                        }}>
                            {item.user_query.slice(0, 1).toUpperCase() +
                  item.user_query.slice(1, charLimit).toLowerCase() +
                  (item.user_query.length > charLimit ? "..." : "")}
                        </span>
                    )
                })
               }
            </div>
            } */}
            </div>
        )
    }

    const menuItems = [
        { id: 'price', label: 'Price Prediction', icon: <BarChart3 size={18} /> },
        { id: 'portfolio', label: 'Portfolio', icon: <PieChart size={18} /> },
        { id: 'yield', label: 'Yield Finder', icon: <Compass size={18} /> },
      ];
    return (
        <Box className="SideBarWrapper">
            <div className="TopContainer">
            <div className="SideBarHeader">
                <div>
                <Image src={DAPP_LOGO} height={25} width={25} alt="logo" className="SideBarLogo"/>
                </div>
           
            <span className="HeadingTextSidebar">The Assistant</span>
        </div>
        {/* <div className="OptionContainer">
            <div className="OptionElement">
                <div className="optionElementLeft">
                <div className="sidebar-menu-icon">
                
            </div>
            <span className="sidebar-menu-label">Chat</span>
                </div>
                
                
            </div>
            
        </div> */}
        {renderChatSummary()}
        <div className="sidebar-menu">
        <div key={"chat"} className="sidebar-menu-item">
              <div className="sidebar-menu-icon"><MessageSquare size={18} /> </div>
              <span className="sidebar-menu-label">Chat</span>
              <div className="sidebar-menu-icon" onClick={()=>{
                    useAgentStore.getState().clearCurrentValues()
                    useAgentStore.getState().setActiveChatId()
                    if(!openArena){
                        useAgentStore.getState().handleOpenArena()
                    }
                }}>
                <IoMdAdd />
                </div>
        </div>
          {menuItems.map((item) => (
            <div key={item.id} className="sidebar-menu-item">
              <div className="sidebar-menu-icon">{item.icon}</div>
              <span className="sidebar-menu-label">{item.label}</span>
            </div>
          ))}
        </div>
        </div>
        <SocialComponent />
        </Box>
    )
}