import axios from "axios";
import "./styles.scss"
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { useState } from "react";
import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader";
import { CustomSpinner } from "@/Components/Backend/Common/CustomSpinner";
import { TvlGraphContainer } from "../GraphContainer";
import { TokenSelectionTab } from "../TokenSelectionTab";
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
            const response=await axios.get("/api/PredictPrice",{
                params:{
                    tokenName:tokenName
                }
            });
            useAgentStore.getState().setPredictionChat({
                query:`Predict the price of ${tokenName}`,
                answer: !response.data.agentResponse ? `The Predicted Price of ${tokenName} is ${parseFloat(response.data.data).toFixed(4)}` : JSON.parse(response.data.data).agentResponse
            })
            setResponse(!response.data.agentResponse ? `The Predicted Price of ${tokenName} is ${parseFloat(response.data.data).toFixed(4)}` : JSON.parse(response.data.data).agentResponse)
            console.log(response.data.agentResponse)
            console.log(!response.data.agentResponse ? `The Predicted Price of ${tokenName} is ${parseFloat(response.data.data).toFixed(4)}` : JSON.parse(response.data.data).agentResponse)
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
              <span className="mainHeading">Defiant Price Prediction</span>
              <span className="subHeading">Chat With out AI Assistant for price predictions</span>
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
                    {item.answer.split('\n').map((item,index)=>{
        console.log(item)
        return <div key={index} className="itemResponse">
        {item}
        <br />
      </div>
      })}
                    </div>
                  </div>
                })
                :
                (
                    <div className="ReadyQuery">
                      <span>Welcome to the Price Predictor! Select a token and ask me about price predictions!</span>
                    </div>
                  )}
                  <div className="TopContainer">
        <TvlGraphContainer tokenName={tokenName}/>
        <TokenSelectionTab/>
        </div>
                  {response !== "" && loading && (
                    <div className="ResponseRow">
                      <CustomTextLoader text="Loading" />
                    </div>
                )}
                </div>
            <div className="ChatFooter">
                <div className="PredictButton" onClick={handleClick}>
                    {!loading ? `Predict ${tokenName.toUpperCase()} Price `: <CustomSpinner size="20" color="#000000"/>}
                </div>
            </div>
        </div>
    )
}