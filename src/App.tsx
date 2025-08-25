import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from './lib/supabase';
import { Conversacion, Mensaje } from './types/database';
import { 
  Search, 
  ArrowLeft,
  CheckCheck,
  Send,
  MoreVertical,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock4,
  BarChart,
  Phone,
  X,
  Moon,
  Sun,
  Activity,
  LineChart,
  Star,
  ChevronLeft,
  Settings,
  Zap,
  Grid3X3
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';

// Importar hooks
import useConversations from './hooks/useConversations';
import useMessages from './hooks/useMessages';
import useDashboardData from './hooks/useDashboardData';
import useImageViewer from './hooks/useImageViewer';
import useSettings from './hooks/useSettings';

// Importar componentes
import NavBar from './components/layout/NavSidebar';
import ConversationsSidebar from './components/layout/ConversationsSidebar';
import ChatView from './components/layout/ChatView';
import ImageViewer from './components/chat/ImageViewer';
import SettingsPage from './pages/SettingsPage';
import Login from './components/auth/Login';
import ProspectosView from './components/layout/ProspectosView';
import DemoView from './components/demo/DemoView';
import InsightsView from './components/layout/InsightsView';
import LogsView from './components/layout/LogsView'; // Importar LogsView
import StatsViewOptimized from './components/layout/StatsViewOptimized'; // Importar StatsView optimizado


import InfoModal from './components/ui/InfoModal';

// Tipos de vistas disponibles
type AppView = 'chat' | 'settings' | 'prospectos' | 'demo' | 'insights' | 'logs' | 'stats';

// Hook para debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook personalizado para manejar rutas simples
function useRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return { currentPath, navigate };
}

function App() {
  const { currentPath, navigate } = useRouter();
  
  // --- Ref para almacenar el ID y NÚMERO de la conversación seleccionada --- 
  const selectedConversationRef = useRef<{id: number | null, numero: string | null}>({ id: null, numero: null });

  // --- Callback para manejar la llegada de un nuevo mensaje en tiempo real ---
  const handleNewMessageRealtime = useCallback((newMessage: Mensaje) => {
    // Si el nuevo mensaje pertenece a la conversación actualmente seleccionada,
    // simplemente lo añadimos al estado de mensajes.
    // La suscripción dentro de `useMessages` se encargará de esto de todos modos,
    // pero esta es una capa adicional de reactividad.
    if (selectedConversationRef.current.id === newMessage.conversation_id) {
       console.log("(App.tsx) New message received for the active conversation. The hook should handle it.");
    }
  }, []); 

  const { 
    conversations,
    selectedConversation, 
    searchTerm,
    setSearchTerm,
    isSearching,
    searchResults,
    loadingConversations,
    loadingMore: loadingMoreConversations,
    hasMoreConversations,
    fetchMoreConversations,
    totalConversations,
    justUpdatedConvId,
    markConversationAsRead: markConversationAsReadInList,
    setSelectedConversation,
    fetchConversations: refetchConversations,
    clearSearch
  } = useConversations({ 
    onNewMessageReceived: handleNewMessageRealtime,
  });

  // --- Hooks para mensajes (necesita selectedConversation) --- 
  const {
    messages,
    loadingInitial,
    loadingMore,
    hasMoreMessages,
    messagesEndRef,
    scrollToEnd,
    messageInput,
    setMessageInput,
    markMessagesAsRead,
    handleSendMessage: handleSendMessageFromHook,
    fetchMessages,
    fetchMoreMessages,
  } = useMessages({ 
    conversationId: selectedConversation?.id || null,
    onMessageReceived: handleNewMessageRealtime
  });

  const { 
    modalImage,
    currentImageGroup,
    currentImageIndex,
    openImageViewer,
    closeImageViewer,
    hoverTimerRef, 
    setCurrentImageIndex,
    setModalImage 
  } = useImageViewer();

  // --- Determinar vista actual basada en la ruta ---
  const getCurrentView = (): AppView => {
    switch (currentPath) {
      case '/logs': return 'logs';
      case '/settings': return 'settings';
      case '/prospectos': return 'prospectos';
      case '/demo': return 'demo';
      case '/insights': return 'insights';
      case '/stats': return 'stats';

      default: return 'chat';
    }
  };

  const currentView = getCurrentView();

  // Estado para controlar la visibilidad del chat en móviles
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Estado para detectar si estamos en móvil
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  
  // Estado de Autenticación
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  // Estado para el modal de información de Análisis


  // Efecto para detectar cambios de tamaño de pantalla
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Efecto para ajustar altura en móviles ---
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
      console.log(`App height set to: ${window.innerHeight}px`);
    };

    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    setAppHeight();

    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  // --- Efecto para actualizar la Referencia (ID y NÚMERO) --- 
  useEffect(() => {
      selectedConversationRef.current = { 
          id: selectedConversation?.id ?? null, 
          numero: selectedConversation?.numero ?? null 
      };
      console.log("(App.tsx) selectedConversationRef updated to:", selectedConversationRef.current);
  }, [selectedConversation]);

  // --- Efectos Secundarios Optimizados --- 

  // Cargar mensajes cuando cambia la conversación seleccionada
  useEffect(() => {
    const conversationId = selectedConversation?.id ?? null;
    console.log(`(App.tsx) Conversation changed. ID: ${conversationId}. Triggering fetch.`);
    // La lógica para limpiar o cargar mensajes ahora está centralizada en el hook.
    fetchMessages(conversationId);
  }, [selectedConversation?.id, fetchMessages]);
  
  // Marcar como leído cuando se selecciona una conversación
  useEffect(() => {
    if (selectedConversation?.id && selectedConversation.tiene_no_leidos) {
      console.log('(App.tsx effect) Marking conversation as read:', selectedConversation.id);
      // Pequeño delay para dar tiempo a que la UI reaccione si es necesario
      const timer = setTimeout(() => {
        // Marcamos como leídos los mensajes y actualizamos el estado de la conversación en la lista.
        markMessagesAsRead(selectedConversation.id);
        markConversationAsReadInList(selectedConversation.id);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedConversation, markMessagesAsRead, markConversationAsReadInList]);

  // --- Funciones de Manejo ---

  // Función optimizada para seleccionar conversación
  const handleSelectConversation = useCallback((conv: Conversacion | null) => {
    console.log('(App.tsx) Selecting conversation:', conv?.id);
    setSelectedConversation(conv);
    if (isMobile) {
      setShowMobileChat(true);
    }
  }, [setSelectedConversation, isMobile]);

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };
  
  const handleSendMessage = () => {
    handleSendMessageFromHook(selectedConversation?.id ?? null);
  };

  const handlePrevImage = () => {
    if (currentImageGroup && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setModalImage(currentImageGroup[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageGroup && currentImageIndex < currentImageGroup.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setModalImage(currentImageGroup[currentImageIndex + 1]);
    }
  };

  const handleViewChange = (view: AppView) => {
    // Navegar a la ruta correspondiente
    const routeMap: Record<AppView, string> = {
      'chat': '/',
      'settings': '/settings',
      'prospectos': '/prospectos',
      'demo': '/demo',
      'insights': '/insights',
      'logs': '/logs',
      'stats': '/stats',

    };
    
    navigate(routeMap[view]);
  };

  const handleSelectConversationFromProspect = (numero: string) => {
    const conversationToSelect = conversations.find(c => c.numero === numero);
    if (conversationToSelect) {
      console.log(`(App.tsx) Found conversation for prospect ${numero}. Switching to chat view.`);
      setSelectedConversation(conversationToSelect);
      navigate('/'); // Navegar a la vista de chat
       if (isMobile) {
        setShowMobileChat(true);
      }
    } else {
      console.warn(`(App.tsx) No conversation found for prospect with number: ${numero}`);
      // Opcionalmente, podrías mostrar una notificación al usuario aquí.
    }
  };

  // --- Autenticación ---
  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Datos del Dashboard (ahora usa los mensajes cargados actualmente) ---
  // const { stats, keywords, criticalCount } = useDashboardData(messages, conversations);

  // --- Manejo de Imágenes ---
  const uniqueImages = useMemo(() => {
    const imageMessages = messages.filter(msg => msg.media_url);
    return Array.from(new Set(imageMessages.map(msg => msg.media_url))).filter(Boolean) as string[];
  }, [messages]);

  // --- Función para renderizar contenido de mensajes ---
  const renderMessageContent = useCallback((mensaje: Mensaje) => {
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/gi;
    const matches = mensaje.mensaje.match(imageRegex) || [];
    let mediaUrls: string[] = [];
    if (mensaje.media_url) {
      try {
        const parsed = JSON.parse(mensaje.media_url);
        mediaUrls = Array.isArray(parsed) ? parsed : [mensaje.media_url];
      } catch (e) {
        mediaUrls = [mensaje.media_url];
      }
    }
    const allImages = [...matches, ...mediaUrls.filter(url => url && url.trim() !== '')];
    const uniqueImages = [...new Set(allImages)];
    let textContent = mensaje.mensaje;
    uniqueImages.forEach(url => { textContent = textContent.replace(url, ''); });
    textContent = textContent.trim();

    const handleImageClickInternal = (url: string, index: number) => openImageViewer(url, uniqueImages, index);
    const handleMouseEnterInternal = (url: string, index: number) => {
      hoverTimerRef.current = setTimeout(() => openImageViewer(url, uniqueImages, index), 500);
    };
    const handleMouseLeaveInternal = () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };

    return (
      <>
        {textContent && <div className="message-text">{textContent}</div>}
        {uniqueImages.length > 0 && (
          <div className="message-images">
            {uniqueImages.slice(0, 4).map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={`Imagen ${index + 1}`} 
                className="message-image" 
                onClick={() => handleImageClickInternal(url, index)} 
                onMouseEnter={() => handleMouseEnterInternal(url, index)} 
                onMouseLeave={handleMouseLeaveInternal} 
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
              />
            ))}
          </div>
        )}
      </>
  );
  }, [openImageViewer, hoverTimerRef]);

  // Función para obtener la conversación asociada a un mensaje (para la búsqueda)
  const getConversationFromMessage = (msg: Mensaje): Conversacion | null => {
    return conversations.find(c => c.numero === msg.numero) || null;
  };

  // --- Logout ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error);
    } else {
      setSession(null);
    }
  };

  // --- Renderizado Condicional ---
  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <Activity className="animate-spin text-blue-500 h-12 w-12" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'settings':
        return <SettingsPage />;
      case 'insights':
        return <InsightsView />;
      case 'logs':
        return <LogsView />;
      case 'stats':
        return <StatsViewOptimized />;

      case 'prospectos':
        return (
          <ProspectosView 
            conversations={conversations}
            onSelectConversation={handleSelectConversationFromProspect}
          />
        );
      case 'demo':
        return <DemoView />;
      default:
        return (
          <main className="main-content">
            <ConversationsSidebar
              conversations={conversations}
              onSelectConversation={handleSelectConversation}
              selectedConversation={selectedConversation}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              loading={loadingConversations}
              justUpdatedConvId={justUpdatedConvId}
              isSearching={isSearching}
              searchResults={searchResults}
              onSelectMessageFromSearch={(msg) => {
                const conv = getConversationFromMessage(msg);
                if (conv) handleSelectConversation(conv);
              }}
              getConversationFromMessage={getConversationFromMessage}
              onClearSearch={clearSearch}
              showMobileChat={showMobileChat}
              loadingMore={loadingMoreConversations}
              hasMoreConversations={hasMoreConversations}
              fetchMoreConversations={fetchMoreConversations}
              totalConversations={totalConversations}
            />
            <ChatView
              selectedConversation={selectedConversation}
              messages={messages}
              onBackToList={handleBackToList}
              showMobileChat={showMobileChat}
              onSendMessage={handleSendMessage}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              // Props para paginación
              fetchMoreMessages={fetchMoreMessages}
              hasMoreMessages={hasMoreMessages}
              loadingInitial={loadingInitial}
              loadingMore={loadingMore}
            />
          </main>
        );
    }
  };

  return (
    <div className={`app-container theme-${localStorage.getItem('theme') || 'dark'} flex flex-col h-screen`}>
      <div className="main-content aligned-layout">
        {!isMobile && (
          <NavBar 
            showMobileChat={showMobileChat} 
            currentView={currentView}
            onViewChange={handleViewChange}
            handleLogout={handleLogout}
            onNavigateBack={handleBackToList}
          />
        )}
        
        {renderActiveView()}
      </div>

      {/* Barra de navegación inferior siempre visible en móvil */}
      {isMobile && (
        <NavBar 
          showMobileChat={showMobileChat}
          currentView={currentView}
          onViewChange={handleViewChange}
          handleLogout={handleLogout}
          onNavigateBack={handleBackToList}
        />
      )}
      
      {/* Visor de imágenes */}
      {modalImage && (
        <ImageViewer
          modalImage={modalImage}
          currentImageGroup={currentImageGroup}
          currentImageIndex={currentImageIndex}
          onClose={closeImageViewer}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
        />
      )}


    </div>
  );
}

export default App;
