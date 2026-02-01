"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if the current viewport is mobile-sized (≤768px)
 * Uses window.matchMedia for efficient media query detection
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Set initial value
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Check on mount
    checkMobile();

    // Create media query matcher
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    // Handler for media query changes
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Add listener (modern browsers support addEventListener)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Also listen to window resize as fallback
    window.addEventListener("resize", checkMobile);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return isMobile;
}
