import { MarketAnalysis } from "@/app/api/MarketAnalysis/route";
export const extractJsonFromResponse = (response: { type: string; content: string }[]) => {
    try {
      const combinedContent = response.map(item => item.content).join("");
      // Find JSON array in the text
      const jsonMatch = combinedContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // Try finding JSON object if array not found
      const jsonObjMatch = combinedContent.match(/\{[\s\S]*\}/);
      if (jsonObjMatch) {
        return JSON.parse(jsonObjMatch[0]);
      }
      return null;
    } catch (error) {
      console.error("Failed to extract JSON from response:", error);
      return null;
    }
  };

  /**
 * Function to convert the values into presentable text
 * @param volume 
 * @returns 
 */

export function formatDisplayText(volume:number,precision:number){
  if (volume < 1000) {
    return `$${volume.toFixed(precision)}`;
  }
  const suffix = volume >= 1000000 ? 'M' : 'K';
  const formattedVolume = new Intl.NumberFormat().format(volume / (suffix === 'M' ? 1000000 : 1000));
  return `$${Number(formattedVolume).toFixed(precision)}${suffix}`;
}


export function extractMarketAnalysis(responseText: string): MarketAnalysis {
	const sections = {
	  HistoricalPerformanceInsight: "",
	  PriceAnalysis: "",
	  marketDynamic: "",
	  RiskAssessment: "",
	  Strengths: "",
	};
  
	const sectionTitles = {
	  PriceAnalysis: "1. PRICE ANALYSIS",
	  marketDynamic: "2. MARKET TRENDS",
	  HistoricalPerformanceInsight: "3. HISTORICAL PERFORMANCE INSIGHTS",
	  RiskAssessment: "4. RISK ASSESSMENT",
	  Strengths: "5. TECHNICAL ANALYSIS", // Adjusted to include key strengths
	};
  
	const keys = Object.keys(sectionTitles) as (keyof MarketAnalysis)[];
	for (let i = 0; i < keys.length; i++) {
	  const currentTitle = sectionTitles[keys[i]];
	  const nextTitle = sectionTitles[keys[i + 1]] || "RECOMMENDATION"; // Next section
  
	  const regex = new RegExp(`${currentTitle}[\\s\\S]*?(?=${nextTitle}|$)`, "i");
	  const match = responseText.match(regex);
	  if (match) {
		sections[keys[i]] = match[0].replace(currentTitle, "").trim();
	  }
	}
  
	return sections;
  }