import { DEFAULT_NATIVE, DEFAULT_OTHER, DEFAULT_STABLE } from "@/Components/Backend/Common/Constants";
import { RebalancerReusableFunction } from "@/Components/Backend/Tools/PortfolioManager";
import { getUserDiversificationPreference } from "@/Components/Backend/Tools/PortfolioManager";

export async function GET(request: Request) {
    const accountAddress = "0x5bafe2c53415743947065e902274f85e6300e9fb27d21bc29c2ce217ea0b37c2";
    try{
        const userPreference=await getUserDiversificationPreference(accountAddress);
        const native=userPreference?.targetAllocation.native || DEFAULT_NATIVE;
        const stable=userPreference?.targetAllocation.stablecoin || DEFAULT_STABLE;
        const other=userPreference?.targetAllocation.other || DEFAULT_OTHER;           
       const result=await RebalancerReusableFunction(stable,native,other)
       return new Response(JSON.stringify(result), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
} catch (err) {
    console.error("Error diversifying portfolio:", err);
    return new Response(JSON.stringify({ 
        success: false, 
        message: "Error diversifying the portfolio" 
    }), {
        status: 500,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
  }