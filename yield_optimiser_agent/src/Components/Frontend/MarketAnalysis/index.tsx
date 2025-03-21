
import { PredictionChatArea } from "./ChatArea"
import "./styles.scss"
import dynamic from "next/dynamic"

const DynamicTokenTab = dynamic(() =>
    import("./TokenSelectionTab").then((mod) => mod.TokenSelectionTab)
  );
  

export const MarketAnalysisWrapperContainer=()=>{
    return <div className="PredictionPriceWrapper">
       <PredictionChatArea/>
    </div>
}