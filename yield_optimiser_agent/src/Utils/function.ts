
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


export const FormatDisplayTextForChat=(response:string):string=>{
  return response.replace(/#/g, '')   // Remove #
  .replace(/\*\*/g, '') // Remove bold markers **
  .replace(/\*/g, '')
  .replace(/\-/g, '')
  .replace(/\*/g, '')
}

export const objectToStringWithNewlines=(obj:any, indent = 0)=>{
  let result = '';
  const spacing = '  '.repeat(indent);
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      result += `${spacing}${key}: \n${objectToStringWithNewlines(obj[key], indent + 1)}\n`;
    } else {
      result += `${spacing}${key}: ${obj[key]}\n`;
    }
  }
  return result;
}
