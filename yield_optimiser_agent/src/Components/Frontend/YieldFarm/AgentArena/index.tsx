import { useCallback, useState, useEffect, act } from "react";
import "./styles.scss";
import { useRef } from "react";
import { AiOutlineEnter } from "react-icons/ai";
import { useShallow } from "zustand/react/shallow";
import axios from "axios";
import { useAgentStore, YieldChat, YieldResponse } from "@/store/agent-store";
import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader";
import Image from "next/image";
import { BACKEND_URL, DAPP_LOGO } from "@/Components/Backend/Common/Constants";
import { AgentChat } from "@/store/agent-store";
import dotenv from "dotenv";
import { FormatDisplayTextForChat, prettyPrintObject } from "@/Utils/function";
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
  const [loader, setLoader] = useState<boolean>(false);
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
  const { activeChat, activeResponse, agentResponses } = useAgentStore(
    useShallow((state) => ({
      activeChat: state.activeYieldChat,
      activeResponse: state.activeYieldResponse,
      agentResponses: state.yieldChats,
    }))
  );

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
      useAgentStore.getState().setActiveYieldChat(userInputRef.current.value);
      useAgentStore.getState().setActiveYieldResponse({
        analysis: "",
        recommendedAction: "",
        userQueryResponse: "",
        swap: "",
      });
      try {
        const { data } = await axios.post(`${BACKEND_URL}/userAnalysis`, {
          message: userInputRef.current?.value,
        });
        delete data.data.recommendedAction.actionRequired;
        delete data.data.swap;
        delete data.data.userQueryResponse;
        console.log("the parsed data is:", prettyPrintObject(data.data));
        const response: YieldResponse = data.data;
        useAgentStore.getState().setActiveYieldResponse({
          analysis: prettyPrintObject(data.data),
        });
        useAgentStore.getState().setYieldChats({
          query: activeChat,
          response: {
            analysis: response.analysis,
            recommendedAction: response.recommendedAction,
            userQueryResponse: response.userQueryResponse,
            swap: response.swap,
          },
        });
      } catch (error) {
        useAgentStore.getState().setActiveYieldResponse({
          analysis: "Sorry We couldn't process your request at the moment",
          recommendedAction: "",
        });
        useAgentStore.getState().setYieldChats({
          query: activeChat,
          response: {
            analysis: "Sorry We couldn't process your request at the moment",
            recommendedAction: "",
          },
        });
        console.error("Error processing agent response:", error);
      }
    }
    return;
  };

  const renderText = (response: YieldResponse) => {
    if (response.analysis === "") return <CustomTextLoader text="Loading" />;
    const renderGeneralToolResponse = (answer: string) => {
      return (
        <div className="SwapBox">
          <div className="Logo">
            <Image src={DAPP_LOGO} height={30} width={30} alt="chatlogo" />
          </div>
          <div className="nestedResponse">
            <span className="responseRow">
              <div className="itemResponse">
                {FormatDisplayTextForChat(answer)}
              </div>
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
      renderGeneralToolResponse(response.analysis)
    );
  };
  const chatArray = agentResponses.length > 0 ? agentResponses : [];
  return (
    <div className="YieldArenaChatArea">
      <div className="YieldArenaChatBox" ref={chatBoxRef}>
        {activeChat === "" && (
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
        )}
        {!MobileDevice && activeChat === "" && (
          <div className="YieldAllButton">
            <span className="centerHeading">
              <span className="head">How can we help you today?</span>
              <Tooltip title="Need help? Get support and guidance here!" arrow>
                <IconButton className="info-icon">
                  <InfoIcon fontSize="small" />
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
                activeResponse.analysis !== ""
                  ? chatArray.length - 1
                  : chatArray.length
              )
              .map((item, index) => {
                const agentResponse: YieldChat = {
                  query: item.query,
                  response: item.response,
                };
                return (
                  <div key={index} className="PastChatBoxYield">
                    <div className="YieldChatTextQuestion">
                      <div className="YieldChatText">{item.query}</div>
                    </div>
                    <div className="YieldChatTextResponse">
                      {renderText(agentResponse.response)}
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
        {activeResponse.analysis === "" && activeChat === "" ? null : (
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
