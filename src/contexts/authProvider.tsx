"use client";
import { RootState } from "@/stores/store";
import { useRouter } from "next/navigation";
import React, { FC, useEffect } from "react";
import { useSelector } from "react-redux";

export interface iLayoutProvider {
  children: any;
}

export const AuthProvider: FC<iLayoutProvider> = ({ children }) => {
  const auth = useSelector((s: RootState) => s.auth);
  const { replace } = useRouter();
  useEffect(() => {
    console.log(
      auth.auth.access_token !== null && auth.auth.access_token.length >= 1,
    );

    if (auth.auth.access_token !== null && auth.auth.access_token.length >= 1) {
      replace("/");
    } else {
      replace("/auth/signin");
    }
  }, [auth.auth.access_token]);

  return <React.Fragment>{children}</React.Fragment>;
};
