import { useState, useEffect } from 'react';

export const useDevicePerformance = () => {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      // Simple heuristic: check hardware concurrency and device memory
      const cores = navigator.hardwareConcurrency || 2;
      const memory = navigator.deviceMemory || 4; // GB

      // Consider low-end if less than 4 cores or less than 4GB RAM
      setIsLowEnd(cores < 4 || memory < 4);
    };

    checkPerformance();
  }, []);

  return isLowEnd;
};
