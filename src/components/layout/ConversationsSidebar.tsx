import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Conversacion, Mensaje } from '../../types/database';
import ConversationItem from '../ui/ConversationItem';
import SearchBar from '../ui/SearchBar';
import SearchResultItem from '../ui/SearchResultItem';

interface ConversationsSidebarProps {
  conversations: Conversacion[];
  selectedConversation: Conversacion | null;
  onSelectConversation: (conv: Conversacion) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  isSearching: boolean;
  searchResults: {
    mensajes: Mensaje[];
    conversaciones: Conversacion[];
  };
  onSelectMessageFromSearch: (msg: Mensaje) => void;
  getConversationFromMessage: (msg: Mensaje) => Conversacion | null;
  onClearSearch: () => void;
  showMobileChat: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMoreConversations: boolean;
  fetchMoreConversations: () => void;
  totalConversations: number;
  isHidden?: boolean;
  justUpdatedConvId: number | null;
}

const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchTerm,
  onSearchTermChange,
  isSearching,
  searchResults,
  onSelectMessageFromSearch,
  getConversationFromMessage,
  onClearSearch,
  showMobileChat,
  loading,
  loadingMore,
  hasMoreConversations,
  fetchMoreConversations,
  totalConversations,
  isHidden = false,
  justUpdatedConvId
}) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (loadingMore || isSearching) return;
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreConversations && !loading) {
        fetchMoreConversations();
      }
    });

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadingMore, hasMoreConversations, fetchMoreConversations, loading, isSearching]);

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const searchConv = Array.isArray(searchResults?.conversaciones) ? searchResults!.conversaciones : [];
  const searchMsgs = Array.isArray(searchResults?.mensajes) ? searchResults!.mensajes : [];
  const isVisible = isMobile ? !isHidden : true;

  if (!isVisible) {
    return null;
  }

  const totalResults = searchConv.length + searchMsgs.length;

  return (
    <div className={`conversations-sidebar ${showMobileChat ? 'hidden' : ''}`}>
      {/* Header simple */}
      <div className="header">
        <h2 className="header-title">Chats</h2>
        <div className="conversation-count">
          {isSearching ? (
            <span>...</span>
          ) : searchTerm ? (
            <span>{totalResults}</span>
          ) : (
            <span>{safeConversations.length}</span>
          )}
        </div>
      </div>

      {/* Barra de búsqueda simple */}
      <SearchBar 
        searchTerm={searchTerm}
        onSearchTermChange={onSearchTermChange}
        placeholder="Buscar..."
        showAdvancedFilters={false}
      />

      {/* Lista de resultados */}
      <div className="conversation-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : searchTerm ? (
          <>
            {/* Resultados de búsqueda */}
            {searchConv.map((conv) => (
              <SearchResultItem
                key={`conv-${conv.id}`}
                conversation={conv}
                searchTerm={searchTerm}
                onClick={() => onSelectConversation(conv)}
              />
            ))}

            {searchMsgs.map((msg) => (
              <SearchResultItem
                key={`msg-${msg.id}`}
                message={msg}
                searchTerm={searchTerm}
                onClick={() => onSelectMessageFromSearch(msg)}
              />
            ))}

            {/* Sin resultados */}
            {totalResults === 0 && !isSearching && (
              <div className="search-no-results">
                <div className="search-no-results-icon">
                  <Search size={48} />
                </div>
                <h3>Sin resultados</h3>
                <p>No se encontró "{searchTerm}"</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Lista normal de conversaciones */}
            {safeConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedConversation?.id === conv.id}
                onClick={() => onSelectConversation(conv)}
                getConversationFromMessage={getConversationFromMessage}
                isNewlyUpdated={conv.id === justUpdatedConvId}
              />
            ))}

            {/* Carga más conversaciones */}
            {hasMoreConversations && (
              <div ref={loadMoreRef} className="load-more-trigger">
                {loadingMore && (
                  <div style={{ textAlign: 'center', padding: '15px' }}>
                    <Loader2 className="animate-spin" size={16} />
                  </div>
                )}
              </div>
            )}

            {/* Fin de conversaciones */}
            {!hasMoreConversations && safeConversations.length > 0 && safeConversations.length < totalConversations && (
              <div style={{ 
                textAlign: 'center', 
                padding: '10px', 
                fontSize: '0.75rem', 
                color: 'var(--color-text-secondary)' 
              }}>
                {safeConversations.length} de {totalConversations}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationsSidebar; 