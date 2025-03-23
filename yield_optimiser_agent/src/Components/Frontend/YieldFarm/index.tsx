import "./styles.scss";
import React, { useState, useEffect } from "react";
import MarketContainer from "./MarketContainer";
import { AgentArena } from "./AgentArena";
import axios from "axios";

import {
  Select,
  MenuItem,
  ThemeProvider,
  createTheme,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  useMediaQuery,
} from "@mui/material";
import { useAgentStore } from "@/store/agent-store";
import { BsLayoutTextSidebar } from "react-icons/bs";
import { BACKEND_URL } from "@/Components/Backend/Common/Constants";
import { CustomSpinner } from "@/Components/Backend/Common/CustomSpinner";

export type EchelonUserData = {
  market: string;
  coin: string;
  supply: number;
  supplyApr: number;
  borrowApr: number;
  coinPrice: number;
};

export type EchelonMarketData = {
  market: string;
  coin: string;
  supply: number;
  supplyApr: number;
  borrowApr: number;
  coinPrice: number;
};


export type PositionData = {
  key: string;
  value: {
    borrow_positions: { data: { key: string; value: string }[] };
    lend_positions: { data: { key: string; value: string }[] };
    position_name: string;
  };
};

export type jouleMarketData = {
  coin: string;
  supply: number;
  supplyApr: number;
  borrowApr: number;
  coinPrice: number;
  type: string;
};

export type JouleUserData = {
  userPositions: {
    positions_map: {
      data: PositionData[];
    };
    user_position_ids: string[];
  }[];
};

export type DataType = {
  echelonUserData: EchelonUserData[];
  echelonMarketData: EchelonMarketData[];
  jouleUserData: JouleUserData;
  jouleMarketData:jouleMarketData[];
};

const YieldFarm = () => {
  const [protocol, setProtocol] = useState("All");
  const [data, setData] = useState<DataType | null>(null);

  const [loading, setLoading] = useState(true);

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#ffb400",
      },
      background: {
        default: "#121212",
        paper: "#1e1e1e",
      },
      text: {
        primary: "#ffffff",
      },
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/getUserPoolData`);
        const responseData: DataType = response.data;
        responseData.echelonMarketData.sort((a, b) => b.supply - a.supply);
        responseData.jouleMarketData.sort((a, b) => b.supply - a.supply);
        setData(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (event: SelectChangeEvent) => {
    setProtocol(event.target.value);
  };

  const MobileDevice = useMediaQuery("(max-width:640px)");
  let filteredData: (EchelonMarketData | jouleMarketData)[] = [];

  data?.jouleMarketData.forEach((item) => {
    item.borrowApr /= 100;
    item.supplyApr /= 100;
  });
  if (protocol === "All") {
    filteredData = [
      ...(data?.echelonMarketData ?? []),
      ...(data?.jouleMarketData ?? []),
    ];
    filteredData.sort((a, b) => b.supply - a.supply);
  } else if (protocol === "Echelon") {
    filteredData = data?.echelonMarketData ?? [];
  } else if (protocol === "Joule") {
    filteredData = data?.jouleMarketData ?? [];
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="yield-farm-container">
        {MobileDevice && (
          <div
            className="YieldSideBarIcon"
            onClick={() => {
              useAgentStore.getState().setOpenSideBar(true);
            }}
          >
            <BsLayoutTextSidebar />
          </div>
        )}
        <div className="parent-container">
          <FormControl className="dropdown-container" variant="filled">
            <InputLabel sx={{ color: "#ffb400" }}>Protocol</InputLabel>
            <Select
              value={protocol}
              onChange={handleChange}
              sx={{
                width: "250px",
                color: "#ffffff",
                backgroundColor: "#1e1e1e",
                borderRadius: "8px",
                fontSize: "18px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ffb400",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ffa726",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#ff9800",
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: "#2c2c2c",
                    borderRadius: "8px",
                    "& .MuiMenuItem-root": {
                      padding: "20px 28px",
                      fontSize: "18px",
                      color: "#ffffff",
                      transition: "background 0.3s",
                    },
                    "& .MuiMenuItem-root:hover": {
                      backgroundColor: "#ffb400",
                      color: "#121212",
                    },
                  },
                },
              }}
            >
              {[
                { label: "All", value: "All" },
                { label: "Joule Finance", value: "Joule" },
                { label: "Echelon", value: "Echelon" },
              ].map((item) => (
                <MenuItem
                  key={item.value}
                  value={item.value}
                  sx={{
                    padding: "20px 28px",
                    fontSize: "18px",
                  }}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Show loading or filtered MarketContainers */}
          {/* Show loading or filtered MarketContainers */}
          {loading ? (
            <div className="spinner-container">
              <CustomSpinner size="60" color="#ffb400" />
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item, index) => (
              <MarketContainer key={index} data={item} protcol={protocol}/>
            ))
          ) : (
            <p>No data available</p>
          )}
        </div>
        <AgentArena />
      </div>
    </ThemeProvider>
  );
};

export default YieldFarm;
