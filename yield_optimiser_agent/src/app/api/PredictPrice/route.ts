import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import dotenv from "dotenv";
import { PredictNextDayPrice } from "@/Components/Backend/Tools/PricePredictionTool";
dotenv.config()
export async function GET(request: NextRequest) {
	try {
         const tokenName = request.nextUrl.searchParams.get("tokenName");
         const predictedPrice=await PredictNextDayPrice(tokenName || "usdc")
        return NextResponse.json({
            data:predictedPrice
        })
	} catch (error) {
	  return NextResponse.json(
		{ error: "Failed to process request", details: error},
		{ status: 500 }
	  );
	}
  }
  