import { SupabaseToken } from "../Types";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();
import { AptosConfig, Network,Aptos } from "@aptos-labs/ts-sdk";
import axios from "axios";

export async function fetchSupportedTokens(): Promise<SupabaseToken[]> {
    try{
        const data = await prisma.token.findMany()
        return data || [];
    }catch(error){
        console.error('Error fetching tokens:', error);
        throw new Error(`Failed to fetch supported tokens: ${error}`);
 }

}


export const fetchTokenPriceInUsd=async (tokenAddress:string)=>{
   try{
    const query = {
        tokenAddress: tokenAddress,
      }
   const url = `https://api.panora.exchange/prices?tokenAddress=${tokenAddress}`
    const result=await axios.get(url,{
        headers:{
            "x-api-key":"a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi",
        }
    })
    return result.data[0].usdPrice
   }catch(error){
    console.error('Error fetching tokens:', error);
    throw new Error(`Failed to fetch supported tokens: ${error}`);
}
}


export const getTokenAmountOwnedByAccount=async (userAddress:string,token_address:string)=>{
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(aptosConfig);

    const userOwnedTokens=await aptos.getAccountCoinAmount({
        accountAddress:userAddress,
        coinType:token_address as `${string}::${string}::${string}`
    })

    return userOwnedTokens
}