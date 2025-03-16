import React from 'react';
import { PieChart, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import "./styles.scss";
import axios from "axios";
import { useState, useEffect } from 'react';
import { Token, UserPortfolio } from '@/Components/Backend/Types';
import { UserAllocations } from '@/Components/Backend/Types';
import { CustomTextLoader } from '@/Components/Backend/Common/CustomTextLoader';
import { PortfolioRebalancer } from './Rebalancer';
import { fetchSupportedTokens } from '@/Components/Backend/Common/Token';
export const Portfolio = () => {
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [allocations] = useState<UserAllocations>({
    stablecoin: 44.19,
    native: 51.08,
    other: 4.74,
  });
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get("/api/Portfolio");
        setPortfolio(response.data.userPortfolio);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      }
    };
    fetchPortfolio();
  }, []);

  if (!portfolio) {
    return <div>
      <CustomTextLoader text='Loading your portfolio'/>
    </div>; 
  }

  const totalValue = portfolio.total_value_usd;
  console.log(portfolio.tokens)
  return (
    <div className="portfolio-wrapper">
      <div className='portfolio-card'>
      <div className="portfolio-header">
        <h2 className="portfolio-title">
          <PieChart size={20} className="portfolio-icon" />
          Portfolio Overview
        </h2>
        <div className="portfolio-actions">
          <button className="portfolio-action-btn">
            <BarChart3 size={16} />
          </button>
          <button className="portfolio-action-btn">
            <TrendingUp size={16} />
          </button>
        </div>
      </div>

      <div className="portfolio-value">
        <div className="portfolio-value-label">Total Portfolio Value</div>
        <div className="portfolio-value-amount">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>


      <div className="portfolio-allocations">
        <div className="portfolio-allocations-title">Allocations</div>
        <div className="portfolio-allocations-list">
          <div className="portfolio-allocation-item">
            <span>Stablecoin</span>
            <span>{allocations.stablecoin}%</span>
          </div>
          <div className="portfolio-allocation-item">
            <span>Native</span>
            <span>{allocations.native}%</span>
          </div>
          <div className="portfolio-allocation-item">
            <span>Other</span>
            <span>{allocations.other}%</span>
          </div>
        </div>
      </div>

      <div className="portfolio-token-list">
        {portfolio.tokens.sort((a,b)=> b.value_usd - a.value_usd).map((token, index) => (
          <div
            key={token.tokenAddress} 
            className="portfolio-token-item"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="portfolio-token-details">
              <div className="portfolio-token-symbol">
                {token.name} 
              </div>
              <div>
                <div className="portfolio-token-name">{token.symbol.replace(":", "")}</div>
                <div className="portfolio-token-balance">
                  {(token.amount / Math.pow(10, token.decimals)).toFixed(2)} {token.symbol.replace(":", "")}
                </div>
              </div>
            </div>
            <div className="portfolio-token-value">
              <div className="portfolio-token-amount">${token.value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div
                className={`portfolio-token-change`}
              >
               ${parseFloat(token.price_usd).toFixed(4)}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
      
      <PortfolioRebalancer tokens={portfolio.tokens} stableAllocation={allocations.stablecoin} nativeAllocation={allocations.native} otherAllocation={allocations.other} totalValue={totalValue}/>
    </div>
  );
};