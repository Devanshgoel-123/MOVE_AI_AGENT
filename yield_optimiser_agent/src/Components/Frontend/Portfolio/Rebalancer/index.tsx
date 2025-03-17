import React, { useState } from "react";
import { Button, Slider, TextField, useMediaQuery } from "@mui/material";
import { RefreshCw } from "lucide-react";
import "./styles.scss";
import { Token } from "@/Components/Backend/Types";
import axios from "axios";
import { useAgentStore } from "@/store/agent-store";
import { pieArcLabelClasses, PieChart } from '@mui/x-charts/PieChart';
interface CategoryAllocation {
  name: string;
  color: string;
  currentAllocation: number;
  targetAllocation: number;
}

interface Props {
  stableAllocation: number;
  otherAllocation: number;
  nativeAllocation: number;
  tokens: Token[];
  totalValue: number;
}

const CATEGORY_COLORS = {
  stable: "#7bf179",
  native: "#4a3e85",
  other: "#5a4b9a"
};

export const PortfolioRebalancer: React.FC<Props> = ({
  tokens,
  totalValue,
  stableAllocation,
  otherAllocation,
  nativeAllocation,
}) => {
  const isXxlDevice=useMediaQuery("(min-width: 1300px)");
  const isXlDevice = useMediaQuery("(min-width: 1020px) and (max-width: 1279px)")
  const calculateCategoryValues = (tokenList: Token[]) => {
    const categoryValues = {
      stable: 0,
      native: 0,
      other: 0
    };
    
    tokenList.forEach(token => {
      categoryValues[token.category as keyof typeof categoryValues] += token.value_usd;
    });
    
    return categoryValues;
  };

  const categoryValues = calculateCategoryValues(tokens);
  
  const initialCategories: CategoryAllocation[] = [
    {
      name: "Stable",
      color: CATEGORY_COLORS.stable,
      currentAllocation: stableAllocation,
      targetAllocation: stableAllocation
    },
    {
      name: "Native",
      color: CATEGORY_COLORS.native,
      currentAllocation:nativeAllocation,
      targetAllocation: nativeAllocation
    },
    {
      name: "Other",
      color: CATEGORY_COLORS.other,
      currentAllocation: otherAllocation,
      targetAllocation: otherAllocation
    }
  ];

  const [categories, setCategories] = useState<CategoryAllocation[]>(initialCategories);
  const [rebalancing, setRebalancing] = useState(false);

  const totalAllocation = categories.reduce((sum, category) => sum + category.targetAllocation, 0);

  const handleAllocationChange = (index: number, newValue: number | number[]) => {
    const updatedCategories = [...categories];
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    const difference = Math.floor(value) - updatedCategories[index].targetAllocation;

    updatedCategories[index].targetAllocation = value;

    if (difference > 0) {
      const otherCategories = updatedCategories.filter((_, i) => i !== index);
      const otherTotalAllocation = otherCategories.reduce((sum, category) => sum + category.targetAllocation, 0);

      if (otherTotalAllocation > 0) {
        updatedCategories.forEach((category, i) => {
          if (i !== index && category.targetAllocation > 0) {
            const proportion = category.targetAllocation / otherTotalAllocation;
            const reduction = Math.round(difference * proportion);
            updatedCategories[i].targetAllocation = Math.max(0, Math.floor(category.targetAllocation - reduction));
          }
        });
      }
    } else if (difference < 0) {
      const otherCategories = updatedCategories.filter((_, i) => i !== index);
      const otherTotalAllocation = otherCategories.reduce((sum, category) => sum + category.targetAllocation, 0);

      if (otherTotalAllocation > 0) {
        updatedCategories.forEach((category, i) => {
          if (i !== index) {
            const proportion = category.targetAllocation / otherTotalAllocation;
            const addition = Math.round(Math.abs(difference) * proportion);
            updatedCategories[i].targetAllocation += Math.floor(addition);
          }
        });
      }
    }

    const newTotal = updatedCategories.reduce((sum, category) => sum + category.targetAllocation, 0);
    if (newTotal !== 100) {
      const largestIndex = updatedCategories
        .map((category, i) => (i !== index ? { index: i, value: category.targetAllocation } : { index: -1, value: -1 }))
        .filter((item) => item.index !== -1)
        .sort((a, b) => b.value - a.value)[0]?.index;
      if (largestIndex !== undefined) {
        updatedCategories[largestIndex].targetAllocation += 100 - newTotal;
      } else {
        updatedCategories[index].targetAllocation = 100;
      }
    }

    setCategories(updatedCategories);
  };

  const handleDirectInput = (index: number, newValue: string) => {
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      handleAllocationChange(index, numValue);
    }
  };

  const handleRebalance = async () => {
    setRebalancing(true);
    console.log(`Rebalance my tokens portfolio to ${categories[0].targetAllocation} ${categories[0].name.toLowerCase()}, ${categories[1].targetAllocation} ${categories[1].name.toLowerCase()} and ${categories[2].targetAllocation} ${categories[2].name.toLowerCase()}`);
    try{
      const { data } = await axios.post("/api/Agent", {
        message:`Rebalance my tokens portfolio to ${categories[0].targetAllocation} ${categories[0].name.toLowerCase()}, ${categories[1].targetAllocation} ${categories[1].name.toLowerCase()} and ${categories[2].targetAllocation} ${categories[2].name.toLowerCase()}`,
        chatId: useAgentStore.getState().activeChatId,
      });
      setTimeout(() => {
        const rebalancedCategories = categories.map((category) => ({
          ...category,
          currentAllocation: category.targetAllocation,
        }));
        setCategories(rebalancedCategories);
        setRebalancing(false);
      }, 1500);
    }catch(error){
      console.log(error)
      setRebalancing(false)
    }   
  };
  
  return (
    <div className="portfolio-rebalancer-card">
      <div className="portfolio-rebalancer-header">
        <h2 className="portfolio-rebalancer-title">
          <RefreshCw size={20} className="portfolio-rebalancer-icon" />
          Portfolio Category Rebalancer
        </h2>
      </div>

      <div className="portfolio-rebalancer-content">
        <div className="portfolio-rebalancer-controls">
          <div className="portfolio-rebalancer-label">Adjust target allocations by category</div>
          {categories.map((category, index) => (
            <div key={category.name} className="portfolio-rebalancer-item">
              <div className="portfolio-rebalancer-token-info">
                <div
                  className="portfolio-rebalancer-token-color"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name} Assets</span>
                <div className="portfolio-rebalancer-token-allocations">
                  <span>Current: {category.currentAllocation}%</span>
                  <span>Target:</span>
                  <TextField
                    type="number"
                    size="small"
                    variant="outlined"
                    value={category.targetAllocation}
                    onChange={(e) => handleDirectInput(index, e.target.value)}
                    sx={{
                      width: 60,
                      marginLeft: 1,
                      "& .MuiOutlinedInput-root": {
                        background: "#1e1e1e",
                        color: "#ffffff",
                        borderColor: "#1a1a1a",
                      },
                      "& .MuiInputBase-input": {
                        padding: "4px",
                      },
                    }}
                  />
                </div>
              </div>
              <Slider
                value={category.targetAllocation}
                min={0}
                max={100}
                step={1}
                onChange={(_, newValue) => handleAllocationChange(index, newValue)}
                sx={{
                  width: "80%",
                  margin: "0 auto",
                  fill: category.color,
                  "& .MuiSlider-track": {
                    backgroundColor: category.color,
                    fontSize:"10px"
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "#1e1e1e",
                  },
                  "& .MuiSlider-thumb": {
                    fill:category.color,
                  },
                }}
              />
            </div>
          ))}  
        </div>
        <div className="portfolio-rebalancer-footer">
            <div className="portfolio-rebalancer-total">
              Total: {Math.min(totalAllocation,100)}%
              
            </div>
            <div
              onClick={handleRebalance}
              className="RebalancerButton"
            >
              {rebalancing ? "Rebalancing..." : "Rebalance Portfolio"}
            </div>
          </div>
      </div>
      <div className="PieChart">
      <PieChart
      series={[
        {
          data: [
            { id: 0, value: stableAllocation, label: 'StableCoin' },
            { id: 1, value: nativeAllocation, label: 'Native' },
            { id: 2, value: otherAllocation, label: 'Other' },
          ],
          innerRadius:15,
          cx:isXlDevice ? 20:45,
          cy:isXxlDevice ? 185 : isXlDevice ? 110:125,
          paddingAngle: 4,
          cornerRadius: 2,
          highlightScope: { fade: 'global', highlight: 'item' },
      faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
        },
      ]}
      sx={{
        [`& .${pieArcLabelClasses.root}`]: {
          fontWeight: 'bold',
          fill:"#ffffff"
        },
      }}
      slotProps={{
        legend:{
          labelStyle:{
            fontSize:12,
            fill:"#ffffff"
          }
        }
      }}
      width={isXxlDevice ? 400: isXlDevice ? 220:280}
      height={isXxlDevice ? 400: isXlDevice ? 220:280}
    />
      </div>
    </div>
  );
};