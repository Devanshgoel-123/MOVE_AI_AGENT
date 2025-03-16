import React from 'react';
import { PieChart, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import "./styles.scss";
// Sample token data
const tokens = [
  { symbol: 'ETH', name: 'Ethereum', balance: '1.25', value: 4312.50, change: 2.4 },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.08', value: 3840.00, change: -1.2 },
  { symbol: 'LINK', name: 'Chainlink', balance: '120', value: 1440.00, change: 3.7 },
  { symbol: 'UNI', name: 'Uniswap', balance: '85', value: 510.00, change: 0.5 },
];

export const Portfolio: React.FC = () => {
  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

  return (
    <div className="portfolio-card">
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
        <div className="portfolio-value-amount">${totalValue.toLocaleString()}</div>
      </div>

      <div className="portfolio-token-list">
        {tokens.map((token, index) => (
          <div
            key={token.symbol}
            className="portfolio-token-item"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="portfolio-token-details">
              <div className="portfolio-token-symbol">
                {token.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="portfolio-token-name">{token.name}</div>
                <div className="portfolio-token-balance">
                  {token.balance} {token.symbol}
                </div>
              </div>
            </div>
            <div className="portfolio-token-value">
              <div className="portfolio-token-amount">${token.value.toLocaleString()}</div>
              <div
                className={`portfolio-token-change ${
                  token.change >= 0 ? 'positive' : 'negative'
                }`}
              >
                {token.change >= 0 ? (
                  <ArrowUpRight size={14} className="portfolio-change-icon" />
                ) : (
                  <ArrowDownRight size={14} className="portfolio-change-icon" />
                )}
                {Math.abs(token.change)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="portfolio-view-all-btn">View All Assets</button>
    </div>
  );
};