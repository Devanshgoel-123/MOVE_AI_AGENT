import { CustomTextLoader } from "@/Components/Backend/Common/CustomTextLoader"
import { fetchSupportedTokens } from "@/Components/Backend/Common/Token"
import { SupabaseToken } from "@/Components/Backend/Types"
import { useEffect, useState } from "react"
import "./styles.scss"
import { useAgentStore } from "@/store/agent-store"
import { useShallow } from "zustand/react/shallow"

export const TokenSelectionTab=()=>{
    const [tokens,setTokens]=useState<SupabaseToken[]>([])
    const {
        tokenName
    }=useAgentStore(useShallow((state)=>({
        tokenName:state.predictorTokenName
    })))
    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const result = await fetchSupportedTokens();
                setTokens(result);
            } catch (error) {
                console.error("Error fetching tokens:", error);
            }
        };

        fetchTokens();
    }, []);

    return (
        <div className="TokenSelectionTab">
            {tokens.length > 0 ? (
                tokens.map((token) => (
                    <button key={token.id} className={tokenName.includes(token.name) ?"TokenButton Active" :"TokenButton "} onClick={()=>{
                        useAgentStore.getState().setPredictorTokenName(token.name)
                    }}>
                        {token.name.toUpperCase()}
                    </button>
                ))
            ) : (
                <CustomTextLoader text="Loading Tokens"/>
            )}
        </div>
    );
}