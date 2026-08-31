"use client";

import { useState, useEffect } from "react";

export const useCafeLighting = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const detectLighting = async () => {
      let darkMode = false;

      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        darkMode = true;
      }

      const hour = new Date().getHours();
      if (hour >= 18 || hour < 6) {
        darkMode = true;
      }

      if ("AmbientLightSensor" in window) {
        try {
          const Sensor = (window as Window & { AmbientLightSensor?: new () => EventTarget & { illuminance: number; start: () => void } }).AmbientLightSensor;
          if (Sensor) {
            const sensor = new Sensor();
            sensor.addEventListener("reading", () => {
              setIsDarkMode(sensor.illuminance < 50);
            });
            sensor.start();
          }
        } catch {
          // Permission or unsupported — keep time/system fallback
        }
      }

      setIsDarkMode(darkMode);
    };

    detectLighting();
  }, []);

  return isDarkMode;
};
