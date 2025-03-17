"use client";
import React from "react";
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';



interface Props {
  size: string;
  color: string;
}



export const CustomSpinner = ({ size, color }: Props) => {


  return (
    <Stack spacing={2} direction="row" alignItems="center">
    <CircularProgress size={Number(size)} color="success"/>
  </Stack>
  );
};