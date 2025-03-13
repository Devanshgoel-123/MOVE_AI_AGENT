import { ACCOUNT_ADDRESS } from "@/Components/Backend /Common/Constants";
import { fetchSupportedTokens, getTokenAmountOwnedByAccount } from "@/Components/Backend /Common/Token";
import { FindAndExecuteArbritrageOppurtunity } from "@/Components/Backend /Tools/ArbritrageFinder";
import { PredictNextDayPrice } from "@/Components/Backend /Tools/PricePredictionTool";

export async function GET(request: Request) {
    try{ 
        const tokens=await fetchSupportedTokens();
        const tokenName=tokens.map(item => item.name)
        const futurePrice=await Promise.all(tokenName.map(name => PredictNextDayPrice(name)))
        console.log("the future price is:",futurePrice)
        return new Response(JSON.stringify({
            message:futurePrice
        }),{
            status:200,
            headers:{
                'Content-Type': 'application/json'
            }
        })
    }catch (err) {
        console.error("Error Predicting the price of token:", err);
        return new Response(JSON.stringify({ 
            success: false, 
            message: "Error Prediction price of token" 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}