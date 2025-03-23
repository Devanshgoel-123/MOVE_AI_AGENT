import { useMediaQuery } from "@mui/material";
import "./styles.scss";
import React, { useState } from "react";
import { EchelonMarketData } from "..";

type MarketContainerProps = {
  data: EchelonMarketData;
};
const MarketContainer: React.FC<MarketContainerProps> = ({ data }) => {
  const [amount, setAmount] = useState("");
  const MobileDevice = useMediaQuery("(max-width:600px)");
  const parts = data.coin.split("::");
  const result = parts[parts.length - 1];

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
              setAmount(value);
            }
          }}
          className="amount-input"
        />
        <button className="stake-btn">Lend</button>
        <button className="unstake-btn">Borrow</button>
      </div>
    </div>
  );
};

export default MarketContainer;
