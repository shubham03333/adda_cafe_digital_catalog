"use client";

import { useState, useEffect } from "react";

export const useDevicePerformance = () => {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
    setIsLowEnd(cores < 4 || memory < 4);
  }, []);

  return isLowEnd;
};
