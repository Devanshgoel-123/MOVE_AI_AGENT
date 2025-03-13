import React from "react";
import "./styles.scss";

import Link from "next/link";

import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { FaXTwitter } from "react-icons/fa6";
import { FaDiscord } from "react-icons/fa";
import { TiDocumentText } from "react-icons/ti";
export const TWITTER_LINK = "https://twitter.com/eddy_protocol";
export const DISCORD_LINK = "https://discord.gg/37zcAqscEv";
export const DOCS_LINK = "https://docs.eddy.finance/";

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
            <Box
              className="SocialLink"
              onClick={() => {
                handleOpenLink(DISCORD_LINK);
              }}
            >
              <Box className="Icon">
                <FaDiscord />
              </Box>
              <span>Discord</span>
            </Box>
            <Box
              className="SocialLink"
              onClick={() => {
                handleOpenLink(DOCS_LINK);
              }}
            >
              <Box className="Icon">
                <TiDocumentText />
              </Box>
              <span>Documentation</span>
            </Box>
          </Box>
        </Box>
  );
};
