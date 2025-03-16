import { create } from "zustand";
// export interface Response{
//   outputString:string;
//   quote:string;
//   toolCalled?:boolean;
// }

interface AgentStore{
  openArena:boolean;
  handleCloseArena:()=>void;
  handleOpenArena:()=>void;
  activeChat:string;
  setActiveChat:(chat:string)=>void;
  activeChatId:number;
  activeResponse:string;
  agentResponses:string[];
  setActiveResponse:(response:string)=>void;
  clearCurrentValues:()=>void;
  setActiveChatId:()=>void;
  activeComponent:string;
  predictorTokenName:string;
  setActiveComponent:(value:string)=>void;
  setPredictorTokenName:(value:string)=>void;
}

export const useAgentStore=create<AgentStore>((set,get)=>({
    openArena:false,
    activeResponse:"",
    activeTransactionHashResponse:{
      outputString:"",
      quote:"",
      query:"",
      activeTransactionHash:""
    },
    disable:false,
    sendingTransaction:false,
    showTransactionHash:false,
    activeChatId:1,
    userChatSummary:[],
    agentResponses:[],
    userChats:[],
    predictorTokenName:"aptos",
    handleOpenArena:()=>{
        set((state)=>({
            openArena:true
        }))
    },
    handleCloseArena:()=>{
        set((state)=>({
            openArena:true
        }))
    },
    activeChat:"",
    setActiveChat:(chat:string)=>{
    set((state)=>{
      return {
        activeChat:chat,
      }
    })
    },
    setActiveResponse:(response:string)=>{
        set((state)=>({
              activeResponse:response,
              //agentResponses:response!==undefined && response.quote==="" && response.outputString==="" ? [...state.agentResponses,response] : state.agentResponses,
              agentResponse:[...state.agentResponses,response]
        }))
    },
      setActiveChatId:()=>{
        set((state)=>({
          activeChatId:state.activeChatId+1
        }))
      },
      clearCurrentValues:()=>{
        set((state)=>({
          activeChat:"",
          activeResponse:""
      }))
      },
      activeComponent:"chat",
      setActiveComponent:(value:string)=>{
        set((state)=>({
          activeComponent:value
        }))
      },
      setPredictorTokenName:(value:string)=>{
        set((state)=>({
          predictorTokenName:value
        }))
      }
      
}))