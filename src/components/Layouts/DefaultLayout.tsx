"use client";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor;
  // Check for mobile devices
  return /android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(userAgent);
};

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(!isMobileDevice());
  const pathname = usePathname();
  useEffect(() => {
    const isMobile = isMobileDevice()
    if (isMobile) setSidebarOpen(false)
  }, [])

  return (
    <>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex">
        {/* <!-- ===== Sidebar Start ===== --> */}
        {!pathname.includes("/auth") && (
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        )}

        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div
          className={`"relative flex flex-1 flex-col w-full overflow-x-auto duration-150 ${!pathname.includes("/auth") && sidebarOpen && "lg:ml-72.5"}`}
        >
          {/* <!-- ===== Header Start ===== --> */}
          {!pathname.includes("/auth") && (
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          )}

          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </>
  );
}
