
import { PredictionChatArea } from "./ChatArea"
import { TvlGraphContainer } from "./GraphContainer"
import "./styles.scss"
import { TokenSelectionTab } from "./TokenSelectionTab"
export const PredictionPriceWrapperContainer=()=>{
    return <div className="PredictionPriceWrapper">
        <div className="TopContainer">
        <TvlGraphContainer/>
        <TokenSelectionTab/>
        </div>
       <PredictionChatArea/>
    </div>
}