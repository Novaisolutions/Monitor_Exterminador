import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Users,
  BarChart,
  Settings,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Calendar,
  UserPlus,
  Zap,
  Lightbulb,
  Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useTheme from '../../hooks/useTheme';
import InfoModal from '../ui/InfoModal';

// Tipos de vistas posibles (debería centralizarse o importarse)
type AppView = 'chat' | 'settings' | 'prospectos' | 'demo' | 'insights' | 'logs' | 'stats';

// Actualizamos las props para incluir la nueva vista
interface NavBarProps {
  showMobileChat: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  currentView?: AppView;
  onViewChange?: (view: AppView) => void;
  handleLogout: () => void;
  onNavigateBack?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ 
  showMobileChat, 
  theme = 'dark', 
  onToggleTheme,
  currentView = 'chat',
  onViewChange,
  handleLogout,
  onNavigateBack
}) => {
  // Obtener theme y toggleTheme del hook
  const { theme: contextTheme, toggleTheme } = useTheme();

  // Estado para el modal de funcionalidad en desarrollo
  const [showDevModal, setShowDevModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Determinar si estamos en móvil o escritorio
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  
  // Efecto para detectar cambios de tamaño de pantalla
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // En móvil, siempre visible
  // En escritorio, sólo visible cuando no estamos en chat si estamos en lateral
  const isVisible = isMobile ? true : !showMobileChat;
  
  // Clase CSS según el modo (móvil o escritorio)
  const navClass = isMobile ? 'nav-footer' : 'nav-sidebar';
  
  // Helper para el click en los iconos
  const handleNavClick = (targetView: AppView) => {
    // Bloquear acceso a insights con popup informativo
    if (targetView === 'insights') {
      setShowDevModal(true);
      return;
    }
    // Bloquear acceso a estadísticas con popup informativo
    if (targetView === 'stats') {
      setShowStatsModal(true);
      return;
    }

    // Si estamos en móvil, viendo un chat, y se pulsa el icono de chat
    if (isMobile && currentView === 'chat' && targetView === 'chat' && showMobileChat && onNavigateBack) {
      onNavigateBack();
    } else if (onViewChange) {
      onViewChange(targetView);
    }
  };

  return (
    <div className={`${navClass} ${!isVisible ? 'hidden' : ''}`}>
      {!isMobile && (
        <div className="nav-sidebar-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Logo de Exterminador - Cucaracha estilizada */}
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M20 28C20 24 24 20 28 20C30 20 32 21 33 22C34 21 36 20 38 20C42 20 46 24 46 28C46 32 44 36 42 38C40 40 38 41 36 40C35 39 34 38 33 38C32 38 31 39 30 40C28 41 26 40 24 38C22 36 20 32 20 28Z" fill="currentColor" opacity="0.3"/>
            <path d="M28 32L30 30M34 30L36 32M32 36C30 34 34 34 32 36Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="32" y="48" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">XT</text>
          </svg>
        </div>
      )}
      <div className={isMobile ? 'nav-footer-menu' : 'nav-sidebar-menu'}>
        {/* Chats */}
        <div 
          className={`nav-item ${currentView === 'chat' ? 'active' : ''}`}
          onClick={() => handleNavClick('chat')}
          role="button" 
          aria-label="Chats"
        >
          <MessageSquare size={20} />
        </div>

        {/* Insights Inteligentes (activo pero con pop up informativo) */}
        <div 
          className={`nav-item ${currentView === 'insights' ? 'active' : ''} relative`}
          onClick={() => handleNavClick('insights')}
          role="button" 
          aria-label="Insights Inteligentes"
        >
          <Lightbulb size={20} />
          {/* Indicador de desarrollo */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>

        {/* Prospectos */}
        <div 
          className={`nav-item ${currentView === 'prospectos' ? 'active' : ''}`}
          onClick={() => handleNavClick('prospectos')}
          role="button" 
          aria-label="Prospectos de Control de Plagas"
        >
          <UserPlus size={20} />
        </div>



        {/* Estadísticas MKT (activo pero con pop up informativo) */}
        <div 
          className={`nav-item ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => handleNavClick('stats')}
          role="button" 
          aria-label="Panel de Estadísticas Exterminador"
        >
          <BarChart size={20} />
        </div>

        {/* Google Calendar */}
        <div 
          className="nav-item"
          onClick={() => window.open('https://calendar.google.com/calendar/u/0/r/month', '_blank')}
          role="button" 
          aria-label="Abrir Google Calendar - Vista Mensual"
        >
          <Calendar size={20} />
        </div>

        {/* Theme Toggle */}
        <div 
          className="nav-item theme-toggle" 
          onClick={() => { 
            console.log('[NavSidebar] Theme toggle button clicked!');
            toggleTheme();
          }}
          role="button" 
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </div>

        {/* Logout */}
        <div 
          className="nav-item" 
          onClick={handleLogout} 
          role="button" 
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} />
        </div>
      </div>

      {/* Modal de funcionalidad en desarrollo */}
      <InfoModal 
        isOpen={showDevModal}
        onClose={() => setShowDevModal(false)}
        title="Panel de Insights Inteligentes"
      >
        <p>Esta demo se activará al tener aproximadamente el equivalente a un mes de conversaciones.</p>
      </InfoModal>

      <InfoModal 
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Panel de Estadísticas"
      >
        <p>Esta demo se activará al tener aproximadamente el equivalente a un mes de conversaciones.</p>
      </InfoModal>
    </div>
  );
};

export default NavBar;