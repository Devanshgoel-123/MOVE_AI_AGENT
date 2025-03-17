
import { NextRequest, NextResponse } from "next/server";
import axios from "axios"
export async function GET(request: NextRequest) {
	try {
       const tokenName = request.nextUrl.searchParams.get("tokenName");
       const poolData=await fetchTopPoolsOnNetwork(tokenName as string);
	  return NextResponse.json({
		data:poolData
	  });
	} catch (error) {
	  console.log(error)
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  


export const fetchTopPoolsOnNetwork=async(tokenName:string)=>{
    try{
        const result=await axios.get("https://api.geckoterminal.com/api/v2/networks/aptos/pools?page=5&sort=h24_volume_usd_desc")
        const filteredData = result.data.data.filter((item) => {
            return (item.attributes.name.includes(tokenName.toUpperCase())) ;
          });
          const poolFinalData = filteredData
          .filter(item => {
            const dexId = item.relationships.dex.data.id;
            return dexId.includes("liquid") || dexId.includes("joule") || dexId.includes("thala");
          })
          .map((item) => {
            return {
              id: item.id,
              changePercentage: item.attributes.price_change_percentage["h24"],
              dex: item.relationships.dex.data.id,
              base_token: item.relationships.base_token.data.id,
              quote_token: item.relationships.quote_token.data.id,
            };
          });
        console.log(poolFinalData)
        return poolFinalData
    }catch(error){
        console.log(error)
    }
}
