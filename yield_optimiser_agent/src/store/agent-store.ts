import { create } from "zustand";
export interface AgentChat {
  outputString: string;
  query: string;
  toolCalled?: boolean;
  chatId: number;
}

export interface PredictionChat {
  query: string;
  answer: string;
}

export interface YieldResponse{
  analysis: string;
  recommendedAction?: any;
  userQueryResponse?: string;
  swap?: any;
}
export interface YieldChat {
  query: string;
  response:YieldResponse
}

interface AgentStore {
  openArena: boolean;
  openSideBar: boolean;
  fetching:boolean;
  yieldAgentFetching:boolean;
  walletAddress: string;
  handleCloseArena: () => void;
  handleOpenArena: () => void;
  activeChat: string;
  setActiveChat: (chat: string) => void;
  activeChatId: number;
  activeYieldChat:string;
  activeYieldResponse:YieldResponse;
  activeResponse: string;
  agentResponses: AgentChat[];
  setAgentResponses: (value: AgentChat) => void;
  setActiveResponse: (response: string) => void;
  clearCurrentValues: () => void;
  setActiveChatId: () => void;
  activeComponent: string;
  predictorTokenName: string;
  setActiveComponent: (value: string) => void;
  setPredictorTokenName: (value: string) => void;
  predictionChat: PredictionChat[];
  setPredictionChat: (chat: PredictionChat) => void;
  yieldChats: YieldChat[];
  agentKey:string;
  setYieldChats: (chat: YieldChat) => void;
  setOpenSideBar: (value: boolean) => void;
  setWalletAddress: (value: string) => void;
  setActiveYieldChat:(value:string)=>void;
  setActiveYieldResponse:(value:YieldResponse)=>void;
  agentWalletAddress:string;
  setAgentWalletAddress:(value:string)=>void;
  setAgentKey:(value:string)=>void;
  setFetching:(value:boolean)=>void;
  setYieldAgentFetching:(value:boolean)=>void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  openArena: false,
  activeResponse: "",
  activeTransactionHashResponse: {
    outputString: "",
    quote: "",
    query: "",
    activeTransactionHash: "",
  },
  yieldAgentFetching:false,
  fetching:false,
  agentWalletAddress:"",
  agentKey:"",
  walletAddress: "",
  yieldChats: [],
  predictionChat: [],
  openSideBar: false,
  disable: false,
  sendingTransaction: false,
  showTransactionHash: false,
  activeChatId: 1,
  userChatSummary: [],
  agentResponses: [],
  userChats: [],
  activeYieldResponse:{
    analysis:"",
    recommendedAction:""
  } as YieldResponse,
  activeYieldChat:"",
  predictorTokenName: "apt",
  handleOpenArena: () => {
    set((state) => ({
      openArena: true,
    }));
  },
  handleCloseArena: () => {
    set((state) => ({
      openArena: true,
    }));
  },

  activeChat: "",
  setActiveChat: (chat: string) => {
    set((state) => {
      return {
        activeChat: chat,
      };
    });
  },
  setActiveResponse: (response: string) => {
    set((state) => ({
      activeResponse: response,
    }));
  },
  setActiveChatId: () => {
    set((state) => ({
      activeChatId: state.activeChatId + 1,
    }));
  },
  clearCurrentValues: () => {
    set((state) => ({
      activeChat: "",
      activeResponse: "",
    }));
  },
  activeComponent: "chat",
  setActiveComponent: (value: string) => {
    set((state) => ({
      activeComponent: value,
    }));
  },
  setPredictorTokenName: (value: string) => {
    set((state) => ({
      predictorTokenName: value,
    }));
  },
  setPredictionChat: (chat: PredictionChat) => {
    set((state) => ({
      predictionChat: [...state.predictionChat, chat],
    }));
  },
  setAgentResponses: (value: AgentChat) => {
    set((state) => ({
      agentResponses: [...state.agentResponses, value],
    }));
  },
  setOpenSideBar: (value: boolean) => {
    set((state) => ({
      openSideBar: value,
    }));
  },
  setYieldChats: (value: YieldChat) => {
    set((state) => ({
      yieldChats: [...state.yieldChats, value],
    }));
  },
  setWalletAddress: (value: string) => {
    set((state) => ({
      walletAddress: value,
    }));
  },
  setActiveYieldChat: (value: string) => {
    set({ activeYieldChat: value });
  },
  setActiveYieldResponse:(response:YieldResponse)=>{
    set({
      activeYieldResponse:response
  })
  },
  setAgentWalletAddress:(value:string)=>{
    set({
      agentWalletAddress:value
    })
  },
  setAgentKey:(value:string)=>{
    set({
    agentKey:value
    })
  },
  setFetching:(value:boolean)=>{
    set({
      fetching:value
    })
  },
  setYieldAgentFetching:(value:boolean)=>{
    set({
      yieldAgentFetching:value
    })
  }
}));
