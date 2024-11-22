"use client";
import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";
import 'maplibre-gl/dist/maplibre-gl.css';
import "react-toastify/dist/ReactToastify.css";
import Loader from "@/components/common/Loader";
import { AuthProvider } from "@/contexts/authProvider";
import { LayoutProvider } from "@/contexts/layoutContext";
import store from "@/stores/store";
import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const persistor = persistStore(store);
  return (
    <html lang="en">
      <head>
        <title>ADP | Depth Clean</title>
        <link rel="icon" href="/images/favicon.ico" />
      </head>
      <body>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <div className="dark:bg-boxdark-2 dark:text-bodydark">
              <LayoutProvider>
                <AuthProvider>
                  {loading ? <Loader /> : children}
                </AuthProvider>
              </LayoutProvider>
            </div>
          </PersistGate>
        </Provider>
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </body>
    </html>
  );
}
