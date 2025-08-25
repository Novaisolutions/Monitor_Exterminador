import { useState, useEffect } from 'react';

// Lista de zonas horarias comunes, con énfasis en México
export const COMMON_TIMEZONES = [
  { value: 'America/Merida', label: 'Mérida (UTC-6)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (UTC-8/UTC-7)' },
  { value: 'America/Cancun', label: 'Cancún (UTC-5)' },
  { value: 'America/New_York', label: 'Nueva York (UTC-5/UTC-4)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8/UTC-7)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1/UTC+2)' },
  { value: 'UTC', label: 'UTC (Tiempo Universal Coordinado)' }
];

export interface UserSettings {
  theme: 'dark' | 'light';
  timeZone: string;
}

function useSettings() {
  // Estado para tema
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  
  // Estado para zona horaria
  const [timeZone, setTimeZoneState] = useState<string>('America/Tijuana');

  // Inicializar desde localStorage cuando se monta
  useEffect(() => {
    // Inicializar tema
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Opcional: Detectar preferencia del sistema si no hay nada guardado
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setThemeState(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
    
    // Inicializar zona horaria
    const savedTimeZone = localStorage.getItem('timeZone');
    if (savedTimeZone) {
      setTimeZoneState(savedTimeZone);
    }
  }, []);

  // Función para cambiar tema
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Función para cambiar zona horaria
  const setTimeZone = (newTimeZone: string) => {
    setTimeZoneState(newTimeZone);
    localStorage.setItem('timeZone', newTimeZone);
  };

  return { 
    theme, 
    toggleTheme,
    timeZone,
    setTimeZone,
    availableTimeZones: COMMON_TIMEZONES
  };
}

export default useSettings; 