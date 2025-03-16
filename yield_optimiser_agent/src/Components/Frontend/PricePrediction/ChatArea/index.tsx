import axios from "axios";
import "./styles.scss"
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { useState } from "react";
import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader";

export const PredictionChatArea=()=>{
    const [loading,setLoading]=useState<boolean>(false);
    const [response,setResponse]=useState<string>("");
     const {
        tokenName
     }=useAgentStore(useShallow((state)=>({
        tokenName:state.predictorTokenName
     })))
  
     const handleClick=async()=>{
        try{
            setLoading(true)
            const response=await axios.get("/api/PredictPrice",{
                params:{
                    tokenName:tokenName
                }
            });
            setResponse(response.data.data)
            console.log(response.data)
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
                <div className="ReadyQuery">
                 <span>Welcome to the Price Predictor! Select a token and ask me about price predictions!</span>
                </div>
               {response!=="" ? !loading ? <div className="ResponseRow">
                    <span>The predicted Price for the token {tokenName} is ${parseFloat(response).toFixed(4)}</span>
                </div> :
                <div className="ResponseRow">
                    <CustomTextLoader text="Loading"/>
                </div>
                :
                null
                }
            </div>
            <div className="ChatFooter">
                <div className="PredictButton" onClick={handleClick}>
                    Predict {tokenName.toUpperCase()} Price
                </div>
            </div>
        </div>
    )
}