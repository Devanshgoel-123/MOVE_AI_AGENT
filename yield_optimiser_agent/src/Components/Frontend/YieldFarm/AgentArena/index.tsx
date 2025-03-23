import { useCallback, useState, useEffect, act } from "react";
import "./styles.scss";
import { useRef } from "react";
import { AiOutlineEnter } from "react-icons/ai";
import { useShallow } from "zustand/react/shallow";
import axios from "axios";
import { useAgentStore } from "@/store/agent-store";
import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader";
import Image from "next/image";
import { BACKEND_URL, DAPP_LOGO } from "@/Components/Backend/Common/Constants";
import { AgentChat } from "@/store/agent-store";
import dotenv from "dotenv";
import { FormatDisplayTextForChat } from "@/Utils/function";
import { useMediaQuery } from "@mui/material";
import { ReadyToClickActionButton } from "../../Agent/AgentChatbox/ButtonContainer";
import { BsLayoutTextSidebar } from "react-icons/bs";
import { Tooltip, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

dotenv.config();
interface Props {
  heading: string;
  content: string;
  query: string;
}
export const AgentArena = () => {
  const MobileDevice = useMediaQuery("(max-width:600px)");
  const MediumDevice = useMediaQuery("(max-width:1028px)");
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const ButtonContent: Props[] = [
    {
      heading: "Market Analysis",
      content: "Conduct An In Depth Analysis of Any Supported Token on Aptos",
      query: "Conduct An In Depth Analysis of Aptos Token",
    },
    {
      heading: "Fetch Token Price",
      content: "Fetch Token Price of a token in USD",
      query: "Fetch the token price",
    },

    {
      heading: "Swap",
      content: "Swap one token to Another",
      query: "Swap token",
    },
  ];
  const { activeChat, activeResponse, agentResponses, chatId } = useAgentStore(
    useShallow((state) => ({
      activeChat: state.activeChat,
      activeResponse: state.activeResponse,
      agentResponses: state.agentResponses,
      chatId: state.activeChatId,
    }))
  );

  console.log("the chat id is", chatId);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [activeChat, activeResponse]);

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
      useAgentStore.getState().setActiveResponse("");
      try {
        const { data } = await axios.post(`${BACKEND_URL}/`, {
          message: userInputRef.current?.value,
          chatId: chatId,
        });
        console.log(data.data);
        const response: string = data.data.agentResponse;
        useAgentStore.getState().setActiveResponse(response);
        useAgentStore.getState().setAgentResponses({
          query: activeChat,
          outputString: response,
          chatId: chatId,
        });
      } catch (error) {
        useAgentStore
          .getState()
          .setActiveResponse(
            "I am sorry, We couldn't process your request at the moment. I am sorry, We couldn't process your request at the moment. I am sorry, We couldn't process your request at the moment. I am sorry, We couldn't process your request at the moment."
          );
        useAgentStore.getState().setAgentResponses({
          query: activeChat,
          outputString:
            "I am sorry, We couldn't process your request at the moment. I am sorry, We couldn't process your request at the moment. I am sorry, We couldn't process your request at the moment. I am sorry, We couldn't process your request at the moment.",
          chatId: chatId,
        });
        console.error("Error processing agent response:", error);
      }
    }
    return;
  };

  const renderText = (response: string) => {
    if (response === "") return <CustomTextLoader text="Loading" />;
    const renderGeneralToolResponse = (answer: string) => {
      return (
        <div className="SwapBox">
          <div className="Logo">
            <Image src={DAPP_LOGO} height={30} width={30} alt="chatlogo" />
          </div>
          <div className="nestedResponse">
            <span className="responseRow">
              {answer.split("\n").map((item, index) => {
                console.log(item);
                return (
                  <div key={index} className="itemResponse">
                    {FormatDisplayTextForChat(item)}
                    <br />
                  </div>
                );
              })}
            </span>
          </div>
        </div>
      );
    };
    return !response || response === undefined ? (
      <div className="nestedResponse">
        <div className="Logo">
          <Image src={DAPP_LOGO} height={30} width={30} alt="chatlogo" />
        </div>
        <span className="responseRow">
          {" "}
          {"Sorry we Couldn't process your request at the moment"}
        </span>
      </div>
    ) : (
      renderGeneralToolResponse(response)
    );
  };
  const chatArray = agentResponses.length > 0 ? agentResponses : [];
  console.log(chatArray);
  return (
    <div className="YieldArenaChatArea">
      <div className="YieldArenaChatBox" ref={chatBoxRef}>
        <div className="ChatHeader">
          <div className="SideBarIconHeader">
            {MobileDevice && (
              <div
                className="SideBarIcon"
                onClick={() => {
                  useAgentStore.getState().setOpenSideBar(true);
                }}
              >
                <BsLayoutTextSidebar />
              </div>
            )}
          </div>
        </div>
        {!MobileDevice && (
          <div className="YieldAllButton">
            <span className="centerHeading">
              <span className="head">How can we help you today?</span>
              <Tooltip title="Need help? Get support and guidance here!" arrow>
                <IconButton className="info-icon">
                  <InfoIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            </span>
            <div className="YieldButtonsWrapper">
              {ButtonContent.map((item: Props, index: number) => {
                return (
                  <ReadyToClickActionButton
                    content={item.content}
                    heading={item.heading}
                    key={index}
                    query={item.query}
                  />
                );
              })}
            </div>
          </div>
        )}

        {chatArray.length > 1
          ? chatArray
              .slice(
                0,
                activeResponse !== "" ? chatArray.length - 1 : chatArray.length
              )
              .map((item, index) => {
                const agentResponse: AgentChat = {
                  query: item.query,
                  outputString: item.outputString,
                  toolCalled: item.toolCalled,
                  chatId: item.chatId,
                };
                return (
                  <div key={index}>
                    <div className="YieldChatTextQuestion">
                      <div className="YieldChatText">{item.query}</div>
                    </div>
                    <div className="YieldChatTextResponse">
                      {renderText(agentResponse.outputString)}
                    </div>
                  </div>
                );
              })
          : null}
        {activeChat !== "" && (
          <div className="YieldChatTextQuestion">
            <div className="YieldChatText">{activeChat}</div>
          </div>
        )}
        {activeResponse === "" && activeChat === "" ? null : (
          <div className="YieldChatTextResponse">
            {renderText(activeResponse)}
          </div>
        )}
      </div>
      <div className="YieldAgentArenaInputContainer">
        <input
          ref={userInputRef}
          onKeyDown={handleKeyPress}
          placeholder="Ask Anything"
          className="YieldAgentInput"
        />
        <div className="EnterButton" onClick={handleEnterClick}>
          <AiOutlineEnter />
        </div>
      </div>
    </div>
  );
};
