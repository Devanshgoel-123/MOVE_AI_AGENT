import React from "react";
import "./styles.scss";

interface Props {
  text: string;
}

export const CustomTextLoader = ({ text }: Props) => {
  return <span className="CustomTextLoader">{text}</span>;
};
