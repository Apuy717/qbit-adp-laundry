"use client";
import { RootState } from "@/stores/store";
import { useRouter, usePathname } from "next/navigation";
import React, { FC, useEffect } from "react";
import { useSelector } from "react-redux";

export interface iLayoutProvider {
  children: any;
}

export const AuthProvider: FC<iLayoutProvider> = ({ children }) => {
  const auth = useSelector((s: RootState) => s.auth);
  const { replace } = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublicPath =
      pathname?.startsWith("/auth") ||
      pathname?.startsWith("/nota") ||
      pathname?.startsWith("/receipt");

    if (!isPublicPath && (auth.auth.access_token === null || auth.auth.access_token.length <= 0)) {
      replace("/auth/signin");
    }
  }, [auth.auth.access_token, replace, pathname]);

  return <React.Fragment>{children}</React.Fragment>;
};


