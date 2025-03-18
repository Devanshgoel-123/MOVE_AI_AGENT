"use client"
import React, { act, useState,useEffect } from "react";
import "./styles.scss";
import  {LineChart} from "@mui/x-charts/LineChart";
import { areaElementClasses, legendClasses, lineElementClasses } from "@mui/x-charts";
import { formatDisplayText } from "@/Utils/function";
import "./styles.scss";
import axios from "axios"
import { CoinGeckoId } from "@/Components/Backend/Types";
import { useAgentStore } from "@/store/agent-store";
import { useShallow } from "zustand/react/shallow";
import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader";
import { CustomSpinner } from "@/Components/Backend/Common/CustomSpinner";
import { useMediaQuery } from "@mui/material";
export const TvlGraphContainer = ({
  tokenName
}:{
  tokenName:string
}) => {
  const isXxlDevice=useMediaQuery("(min-width: 1280px)");
const [tvlDataArray, setTvlDataArray] = useState<{ timestamp: number; price: number }[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [activeId, setActiveId] = useState<number>(-1);
let tokenId:string;
  //  const {
  //   tokenName
  //  }=useAgentStore(useShallow((state)=>({
  //   tokenName:state.predictorTokenName
  //  })))
if(tokenName.toLowerCase()==="usdc"){
  tokenId=CoinGeckoId["usdc"]
}else if(tokenName.toLowerCase()==="aptos" || tokenName.toLowerCase()==="apt"){
  tokenId=CoinGeckoId["aptos"]
}else if(tokenName.toLowerCase()==="usdt"){
   tokenId=CoinGeckoId['usdt']
}else if(tokenName.toLowerCase()==="weth"){
  tokenId=CoinGeckoId["weth"]
}else if(tokenName.toLowerCase()==="thl"){
  tokenId=CoinGeckoId['thala']
}else{
  throw new Error("We currently dont support this token")
}


useEffect(() => {
  if (!tokenId) {
    setError("We currently don't support this token");
    setLoading(false);
    return;
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      
      const response = await axios.get("/api/HistoricalPrice", {
        params: { tokenId },
      });

      if (response.data?.data?.prices) {
        const formattedData = response.data.data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          price,
        }));
        console.log(formattedData)
        setTvlDataArray(formattedData);
      } else {
        setError("Invalid data format from API");
      }
    } catch (err) {
      setError("Failed to fetch historical price data");
    } finally {
      setLoading(false);
    }
  };
   
  fetchData();

}, [tokenId]);
  return (
    <div className="GraphContainer">
        <div className="GraphDetails">
          <div className="GraphInfo">
            <span className="GraphName">Price Analysis of {tokenName.toUpperCase()}</span>
            <span className="ActiveValue">Current Price :  ${tvlDataArray[tvlDataArray.length-1]?.price}</span>
          </div>
        </div>
        {!loading ? <div className="GraphCanvas">
         <LineChart
         dataset={tvlDataArray}
         sx={{
          [`& .${legendClasses.root}`]: {
            display: 'none',
          },
          [`& .${areaElementClasses.root}`]: {
            fill: '#7bf179',
            stroke:'#7bf179',
            strokeOpacity:1,
            fillOpacity:0.6
          },
          [`& .${lineElementClasses.root}`]: {
            stroke:'#7bf179',
            strokeWidth:1.5,
            strokeLinejoin:"bevel"
          }
         }}
         series={[
          {
            dataKey:'price',
            area:true,
            showMark:false,
            label:'PRICE',
          }
         ]}
         
         leftAxis={{
          tickLabelStyle:{
            fontSize:10,
           fill:'#ffffff',
           fontWeight:700,
           fontFamily:"Manrope",
           lineHeight:18,
           opacity:0.5,
          transform:"translateX(20px) translateY(-10px)"
          },
         //tickLabelInterval: (value:number,index:number)=>value%1000===0 && value!=0,
         tickNumber:3,
         tickLabelPlacement:"tick"
         }}
         height={isXxlDevice? 200 :150}
         margin={{
          top:30,
          left:15,
          right:0,
          bottom:20
        }}
        yAxis={[
          {
            scaleType:"linear",
            dataKey:"price",
            valueFormatter(value, context) {
              return `$${formatDisplayText(value,2)}`
            },
          }
         ]}
         xAxis={[
          {
            scaleType:'time',
            dataKey:"timestamp",
            label:"Date",
            valueFormatter(value) { 
              return new Date(value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
            }
          }
         ]}
         onHighlightChange={(item)=>{
          item?.dataIndex ? setActiveId(item.dataIndex):setActiveId(-1)
         }}
         bottomAxis={{
          tickLabelStyle: {
            fontSize: 10,
            fill: "#ffffff",
            fontWeight: 700,
            fontFamily: "Manrope",
            lineHeight: 15,
            opacity: 0.5,
            transform:"translateX(20px) translateY(-5px) Rotate(0deg)",
            overflow:"hidden"
          },
          tickLabelInterval: (value: number, index: number) =>{
           return index%2===0
          }
        }}
       >   

          </LineChart>     
        </div> 
        :
        <div className="GraphLoader">
          <CustomSpinner size="20" color="white"/>
          </div>
        }
  </div>
  );
};
 