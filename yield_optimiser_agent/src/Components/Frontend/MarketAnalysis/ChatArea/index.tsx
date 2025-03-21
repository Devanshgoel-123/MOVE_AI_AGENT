import axios from "axios";
import "./styles.scss"
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { useState } from "react";
import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader";
import { CustomSpinner } from "@/Components/Backend/Common/CustomSpinner";
import { TvlGraphContainer } from "../GraphContainer";
import { TokenSelectionTab } from "../TokenSelectionTab";
import { BACKEND_URL } from "@/Components/Backend/Common/Constants";
export const PredictionChatArea=()=>{
    const [loading,setLoading]=useState<boolean>(false);
    const [response,setResponse]=useState<string>("");
     const {
        tokenName,
        predictionChat
     }=useAgentStore(useShallow((state)=>({
        tokenName:state.predictorTokenName,
        predictionChat:state.predictionChat
     })))
  
     const handleClick=async()=>{
        try{
            setLoading(true)
            const response=await axios.get(`${BACKEND_URL}/marketAnalysis/${tokenName}`);
            console.log(response.data.data.agentResponse)
            useAgentStore.getState().setPredictionChat({
                query:`Perform InDepth Market Analysis of ${tokenName} token`,
                answer: (response.data.data).agentResponse.replace(/#/g, '')   // Remove #
                .replace(/\*\*/g, '') // Remove bold markers **
                .replace(/\*/g, '')
                .replace(/\-/g, '')
                .replace(/\*/g, '')
            })
            setResponse(response.data.data.agentResponse)
            setLoading(false)
        }catch(err){
            setResponse("Sorry We couldn't Process your request at the moment")
            setLoading(false)
          console.log(err)
        }
     }
     
    return (
        <div className="ChatWrapperPrediction">
            <div className="ChatHeader">
              <span className="mainHeading">Defiant Market Analysis</span>
              <span className="subHeading">Chat With out AI Assistant To Perform An In Depth Market Analysis Of A Token</span>
            </div>
            <div className="ChatArea">
                { predictionChat.length>0 ? 
                predictionChat.map((item, index)=>{
                    return  <div key={index}>
                    <div className="ReadyQuery">
                      <span>{item.query}</span>
                    </div>
                    <div className="ResponseRow">
                    <div className="TopContainer">
        <TvlGraphContainer tokenName={tokenName}/>
        <TokenSelectionTab/>
        </div>
                    
                    <div className="ResponseDiv">
                    {item.answer.split('\n').slice(0,-15).map((item,index)=>{
        console.log(item)
        return <div key={index} className="itemResponse">
        {item}
        <br />
      </div>
      })}
                    </div>
                    </div>
                  </div>
                })
                :
                (
                    <div className="ReadyQuery">
                      <span>Welcome to the Defiant! Select a token and ask me to perform it's Market Analysis!</span>
                    </div>
                  )}
                  <div className="TopContainer">
        <TvlGraphContainer tokenName={tokenName}/>
        <TokenSelectionTab/>
        </div>
                  {response !== "" && loading && (
                    <div className="ResponseRowLoading">
                      <CustomTextLoader text="Conducting InDepth Market Analysis" />
                    </div>
                )}
                </div>
            <div className="ChatFooter">
                <div className="PredictButton" onClick={handleClick}>
                    {!loading ? `Perform In Depth Market Analysis of ${tokenName.toUpperCase()} token`: <CustomSpinner size="20" color="#000000"/>}
                </div>
            </div>
        </div>
    )
}