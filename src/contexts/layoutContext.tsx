"use client";
import { usePathname } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isFullscreenRoute =
    pathname?.startsWith("/nota") ||
    pathname?.startsWith("/receipt");

  if (isFullscreenRoute) {
    return <>{children}</>;
  }

  return (
    <DefaultLayout>
      {children}
    </DefaultLayout>
  )
}
