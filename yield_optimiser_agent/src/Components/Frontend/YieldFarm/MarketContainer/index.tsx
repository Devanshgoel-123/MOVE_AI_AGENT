import { useMediaQuery } from "@mui/material";
import "./styles.scss";
import React, { useState } from "react";
import { EchelonMarketData, jouleMarketData } from "..";
import axios from "axios";
import { BACKEND_URL } from "@/Components/Backend/Common/Constants";
type MarketContainerProps = {
  data: EchelonMarketData | jouleMarketData;
  protcol:string;
}

const MarketContainer: React.FC<MarketContainerProps> = ({ data,protcol}:MarketContainerProps) => {
  const [amount, setAmount] = useState<number>(0.00);
  const MobileDevice = useMediaQuery("(max-width:600px)");
  const parts = data.coin.split("::");
  const result = parts[parts.length - 1];
   

  const handleEnterClick=async (value:string)=>{
    try{
     if(amount>0){
      const response=await axios.post(`${BACKEND_URL}/lendBorrowPost`,{
        message:`I want to ${value} ${amount} ${result} on the ${protcol}`
      })}else{
        return
      }
    }catch(err){
      console.log(err)
    }
  }

  return (
    <div className={`deposit-form ${MobileDevice ? "mobile" : ""}`}>
      <div className="header">
        <h2>{result}</h2>
        <span className="market-cap">User Position: {data.supply}</span>
      </div>

      <div className={`market-data-container ${MobileDevice ? "mobile" : ""}`}>
        <div className="market-data">
          <span className="market-data-label">Borrow APR</span>
          <span className="market-data-value">
            {(data.borrowApr * 100).toFixed(2)} %
          </span>
        </div>
        <div className="market-data">
          <span className="market-data-label">Supply APR</span>
          <span className="market-data-value">
            {(data.supplyApr * 100).toFixed(2)} %
          </span>
        </div>
        <div className="market-data">
          <span className="market-data-label">Coin Price</span>
          <span className="market-data-value">
            ${data.coinPrice.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="form-container">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || (Number(value) > 0 && !value.startsWith("0"))) {
              setAmount(Number(value));
            }
          }}
          className="amount-input"
        />
        <button className="stake-btn" onClick={()=>{handleEnterClick("lend")}}>Lend</button>
        <button className="unstake-btn" onClick={()=>{handleEnterClick("borrow")}}>Borrow</button>
      </div>
    </div>
  );
};

export default MarketContainer;
