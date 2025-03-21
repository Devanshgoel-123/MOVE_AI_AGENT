import React from "react";
import "./styles.scss";
import Box from "@mui/material/Box";
import { FaXTwitter } from "react-icons/fa6";
export const TWITTER_LINK = "https://x.com/DeFiZen_2025";


export const SocialComponent = () => {
  /**
   * Function to open external links.
   */
  const handleOpenLink = (link: string) => {
    window.open(link, "_blank");
  };
  return (
        <Box className="DropdownContainerAgent">
          <Box className="SocialLinkContainer">
            <Box
              className="SocialLink"
              onClick={() => {
                handleOpenLink(TWITTER_LINK);
              }}
            >
              <Box className="Icon">
                <FaXTwitter />
              </Box>
              <span>Twitter</span>
            </Box>

          </Box>
        </Box>
  );
};
