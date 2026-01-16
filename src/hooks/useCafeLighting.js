import { useState, useEffect } from 'react';

export const useCafeLighting = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const detectLighting = async () => {
      let darkMode = false;

      // Check prefers-color-scheme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        darkMode = true;
      }

      // Check time of day (evening/night)
      const hour = new Date().getHours();
      if (hour >= 18 || hour < 6) {
        darkMode = true;
      }

      // Try to use AmbientLightSensor if available
      if ('AmbientLightSensor' in window) {
        try {
          const sensor = new AmbientLightSensor();
          sensor.addEventListener('reading', () => {
            if (sensor.illuminance < 50) { // Low light threshold
              setIsDarkMode(true);
            } else {
              setIsDarkMode(false);
            }
          });
          sensor.start();
        } catch (error) {
          console.warn('AmbientLightSensor not available or permission denied');
        }
      }

      setIsDarkMode(darkMode);
    };

    detectLighting();
  }, []);

  return isDarkMode;
};
