
import { PredictionChatArea } from "./ChatArea"
import { TvlGraphContainer } from "./GraphContainer"
import "./styles.scss"
import { TokenSelectionTab } from "./TokenSelectionTab"
import dynamic from "next/dynamic"

const DynamicTokenTab = dynamic(() =>
    import("./TokenSelectionTab").then((mod) => mod.TokenSelectionTab)
  );
  

export const PredictionPriceWrapperContainer=()=>{
    return <div className="PredictionPriceWrapper">
        <div className="TopContainer">
        <TvlGraphContainer/>
        <DynamicTokenTab/>
        </div>
       <PredictionChatArea/>
    </div>
}