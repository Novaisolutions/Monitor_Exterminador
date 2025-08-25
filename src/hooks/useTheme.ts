import { useState, useEffect } from 'react';

function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
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
  }, []);

  const toggleTheme = () => {
    console.log(`[useTheme] toggleTheme called. Current theme state: ${theme}`);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log(`[useTheme] Calculated new theme: ${newTheme}`);
    
    try {
      // Actualizar estado de React
      setThemeState(newTheme);
      console.log("[useTheme] React state updated (async).");
      
      // Modificar DOM
      console.log("[useTheme] Attempting to set data-theme on:", document.documentElement);
      document.documentElement.setAttribute('data-theme', newTheme);
      console.log(`[useTheme] Attribute set. Current data-theme: ${document.documentElement.getAttribute('data-theme')}`);
      
      // Guardar en localStorage
      localStorage.setItem('theme', newTheme);
      console.log(`[useTheme] localStorage updated. New value: ${localStorage.getItem('theme')}`);

    } catch (error) {
      console.error("[useTheme] Error during theme toggle:", error);
    }
  };

  return { theme, toggleTheme };
}

export default useTheme; 