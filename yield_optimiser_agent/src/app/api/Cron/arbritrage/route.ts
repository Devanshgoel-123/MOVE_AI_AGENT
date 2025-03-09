import { ACCOUNT_ADDRESS } from "@/Components/Backend /Common/Constants";
import { fetchSupportedTokens, getTokenAmountOwnedByAccount } from "@/Components/Backend /Common/Token";
import { FindAndExecuteArbritrageOppurtunity } from "@/Components/Backend /Tools/ArbritrageFinder";

export async function GET(request: Request) {
    try{
        const supportedTokens=await fetchSupportedTokens();
        const results = await Promise.all(
            supportedTokens.map(async (token) => {
                const userWalletBalance=await getTokenAmountOwnedByAccount(ACCOUNT_ADDRESS, token.name);
                const formattedBalance=Math.floor((userWalletBalance/10**(token.decimals))*0.5)
                console.log("the formatted Balance is:",formattedBalance)
                const response = await FindAndExecuteArbritrageOppurtunity(
                    token.name.toLowerCase(),
                    formattedBalance,
                    5,
                    supportedTokens
                )
            return response
            })
        );
        return results
    }catch (err) {
        console.error("Error diversifying portfolio:", err);
        return new Response(JSON.stringify({ 
            success: false, 
            message: "Error finding any arbitrage oppurtunity" 
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}