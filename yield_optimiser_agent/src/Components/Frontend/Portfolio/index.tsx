import React from 'react';
import { PieChart, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import "./styles.scss";
import axios from "axios";
import { useState, useEffect } from 'react';
import { Token, UserPortfolio } from '@/Components/Backend/Types';
import { UserAllocations } from '@/Components/Backend/Types';
import { PortfolioRebalancer } from './Rebalancer';
import { CustomSpinner } from '@/Components/Backend/Common/CustomSpinner';
import Image from 'next/image';

export const Portfolio = () => {
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [allocations,setAllocation] = useState<UserAllocations>({
    stablecoin: 49,
    native: 51.08,
    other: 4.74,
  });
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get("/api/Portfolio");
        const Tokens:Token[]=response.data.userPortfolio.tokens;
        console.log(Tokens)
        const stableTokens=Tokens.filter((item)=>item.category==="stablecoin");
        const nativeTokens=Tokens.filter((item)=>item.category==="native");
        const otherTokens=Tokens.filter((item)=>item.category==="other");
        const stableSum = stableTokens.reduce((sum, token) => sum + token.value_usd, 0);
        const nativeSum = nativeTokens.reduce((sum, token) => sum + token.value_usd, 0);
        const otherSum = otherTokens.reduce((sum, token) => sum + token.value_usd, 0);
        const totalSum=response.data.userPortfolio.total_value_usd;
        setAllocation({
          stablecoin:Number(((stableSum/totalSum)*100).toFixed(2)),
          native:Number(((nativeSum/totalSum)*100).toFixed(2)),
          other:Number(((otherSum/totalSum)*100).toFixed(2))
        })
        setPortfolio(response.data.userPortfolio);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      }
    };
    fetchPortfolio();
  }, []);

  if (!portfolio) {
    return <div className='PortfolioLoader'>
     <CustomSpinner color='#1e1e1e1' size='50'/>
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
                <Image src={token.image} height={25} width={25} alt='tokenLogo'/>
              </div>
              <div>
                <div className="portfolio-token-name">{token.name.toUpperCase()}</div>
                <div className="portfolio-token-balance">
                  {(token.amount / Math.pow(10, token.decimals)).toFixed(4)} {token.name.toUpperCase()}
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