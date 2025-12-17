import { useEffect, useState } from "react";

export function useIsMobile() {
    const MOBILE_BREAKPOINT = 768;
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        if(typeof window === "undefined") return;

        const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

        const handleDeviceDetection = () => {
            setIsMobile(mediaQuery.matches);
        }

        mediaQuery.addEventListener("change", handleDeviceDetection);
        handleDeviceDetection();

        return () => {
            mediaQuery.removeEventListener("change", handleDeviceDetection);
        }
    }, []);

    return isMobile;
}