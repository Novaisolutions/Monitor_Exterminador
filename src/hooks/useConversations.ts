import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Conversacion, Mensaje } from '../types/database';
import useDebounce from './useDebounce';

// Constantes para paginación
const CONVERSATIONS_INITIAL_LOAD = 30; // Cargar 30 conversaciones inicialmente (cambiado de 3)
const CONVERSATIONS_PER_PAGE = 30; // Cargar 30 más con scroll infinito

// --- Mock Data Generation (TEMPORARY FOR UI TESTING) ---
const generateMockConversations = (count: number): Conversacion[] => {
  const mocks: Conversacion[] = [];
  const firstNames = ['Ana', 'Luis', 'Carlos', 'Maria', 'Jose', 'Laura', 'David', 'Sofia'];
  const lastNames = ['García', 'Martínez', 'López', 'Rodríguez', 'Pérez', 'Gómez', 'Sánchez', 'Díaz'];
  const statuses: Conversacion['status'][] = ['abierto', 'cerrado', 'pendiente'];
  const messages = [
    'Ok, gracias', '¿Podrías enviarme la cotización?', 'Perfecto, lo reviso.', 
    '¿Cuál es el horario?', 'Necesito ayuda con mi pedido', '¿Tienen sucursal en...?', 
    'Gracias por la información', 'Muy amable', 'Entendido'
  ];

  for (let i = 0; i < count; i++) {
    const numero = `+52 1 55 ${Math.floor(10000000 + Math.random() * 90000000)}`;
    const nombre = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const lastMsg = messages[Math.floor(Math.random() * messages.length)];
    const unread = Math.random() > 0.7; // ~30% chance of unread
    const unreadCount = unread ? Math.floor(1 + Math.random() * 5) : 0;
    const now = new Date();
    const randomPastDate = new Date(now.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 7); // Max 1 week ago
    
    mocks.push({
      id: 10000 + i, // Use high IDs to avoid potential collision with real IDs
      numero: numero,
      nombre_contacto: Math.random() > 0.1 ? nombre : null, // Some without name
      updated_at: randomPastDate.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      ultimo_mensaje_resumen: lastMsg,
      tiene_no_leidos: unread,
      no_leidos_count: unreadCount,
      plantel: Math.random() > 0.5 ? 'Plantel Norte' : 'Plantel Sur',
      resumen_ia: Math.random() > 0.8 ? 'Este es un resumen de IA de ejemplo...' : null,
      resumen: null,
      reactivacion_intentos: 0,
      ultimo_intento_reactivacion: null,
      proximo_seguimiento: null
    });
  }
  return mocks;
};
// --- END Mock Data Generation ---

interface UseConversationsOptions {
  // Función opcional para manejar nuevos mensajes recibidos
  onNewMessageReceived?: (message: Mensaje) => void;
}

export default function useConversations(options: UseConversationsOptions = {}) {
  const { onNewMessageReceived } = options;
  
  // Estados principales
  const [conversations, setConversations] = useState<Conversacion[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversacion | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalConversations, setTotalConversations] = useState<number>(0);
  const [justUpdatedConvId, setJustUpdatedConvId] = useState<number | null>(null);
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ conversaciones: Conversacion[]; mensajes: Mensaje[] }>({ conversaciones: [], mensajes: [] });
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Refs para control
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const previousSearchTerm = useRef('');
  
  // Función para cargar conversaciones iniciales
  const fetchConversations = useCallback(async () => {
    if (!isInitialLoad && loadingConversations) return;
    
    console.log('[useConversations] Fetching initial conversations...');
    setLoadingConversations(true);
    const startTime = performance.now();
    
    try {
      // Intentar usar la función RPC optimizada primero
      const { data: conversationsData, error: conversationsError, count } = await supabase.rpc(
        'get_conversations_with_last_message_date',
        { 
          page_limit: CONVERSATIONS_INITIAL_LOAD,
          page_offset: 0
        }
      ).select('*', { count: 'exact' });

      console.log('[useConversations] Total conversations available:', count);
      setTotalConversations(count || 0);

      // Si la función RPC no existe, usar fallback
      if (conversationsError?.code === '42883') {
        console.log('[useConversations] RPC function not found, using fallback query...');
        
        // Fallback: usar query con subquery para obtener la fecha del último mensaje real
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversaciones_xt_mkt')
          .select(`
            *,
            mensajes_xt_mkt!conversation_id (
              fecha
            )
          `)
          .order('updated_at', { ascending: false })
          .limit(CONVERSATIONS_INITIAL_LOAD);

        if (fallbackError) {
          console.error('Error fetching conversations (fallback):', fallbackError);
          setConversations([]);
          setHasMoreConversations(false);
        } else {
          // Procesar los datos del fallback para obtener la fecha real del último mensaje
          const processedConversations = (fallbackData || []).map(conv => {
            const lastMessageDate = conv.mensajes_xt_mkt?.length > 0 
              ? Math.max(...conv.mensajes_xt_mkt.map((m: { fecha: string }) => new Date(m.fecha).getTime()))
              : new Date(conv.updated_at).getTime();
            
            return {
              ...conv,
              real_last_message_date: new Date(lastMessageDate).toISOString(),
              mensajes_xt_mkt: undefined // Limpiar para no sobrecargar el estado
            };
          });
          
          // Ordenar por fecha del último mensaje real
          const sortedConversations = [...processedConversations].sort((a: Conversacion & { real_last_message_date: string }, b: Conversacion & { real_last_message_date: string }) => {
            const dateA = new Date(a.real_last_message_date || 0);
            const dateB = new Date(b.real_last_message_date || 0);
            return dateB.getTime() - dateA.getTime();
          });

          setConversations(sortedConversations);
        }
      } else if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        setConversations([]);
        setHasMoreConversations(false);
      } else {
        // Datos obtenidos exitosamente de la función RPC
        const sortedConversations = (conversationsData || []).sort((a, b) => {
          const dateA = new Date(a.real_last_message_date || a.updated_at || 0);
          const dateB = new Date(b.real_last_message_date || b.updated_at || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setConversations(sortedConversations);
      }

      setCurrentPage(1);
      
      // Verificar si hay más conversaciones
       const hasMore = (count || 0) > CONVERSATIONS_INITIAL_LOAD;
      setHasMoreConversations(hasMore);
      
      const endTime = performance.now();
      console.log(`[useConversations] Initial fetch completed in ${(endTime - startTime).toFixed(2)}ms. Status: 200`);
      console.log(`[useConversations] Successfully fetched ${CONVERSATIONS_INITIAL_LOAD} initial conversations. Has more: ${hasMore}`);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      setConversations([]);
      setHasMoreConversations(false);
    }

    console.log('[useConversations] Finished initial fetch, loading set to false.');
    setLoadingConversations(false);
    setIsInitialLoad(false);
  }, []);

  // Nueva función para cargar más conversaciones
  const fetchMoreConversations = useCallback(async () => {
    if (loadingConversations || loadingMore || !hasMoreConversations || isSearching) {
      return;
    }

    console.log(`[useConversations] Fetching page ${currentPage} conversations...`);
    setLoadingMore(true);
    
    try {
      const from = currentPage * CONVERSATIONS_PER_PAGE;
      const to = from + CONVERSATIONS_PER_PAGE - 1;

      // Intentar usar la función RPC optimizada
      const { data: conversationsData, error: conversationsError } = await supabase.rpc(
        'get_conversations_with_last_message_date',
        { 
          page_limit: CONVERSATIONS_PER_PAGE,
          page_offset: from
        }
      );

      // Si la función RPC no existe, usar fallback
      if (conversationsError?.code === '42883') {
        console.log('[useConversations] RPC function not found, using fallback query for pagination...');
        
        // Fallback: usar query con subquery
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversaciones_xt_mkt')
          .select(`
            *,
            mensajes_xt_mkt!conversation_id (
              fecha
            )
          `)
          .order('updated_at', { ascending: false })
          .range(from, to);

        if (fallbackError) {
          console.error('Error fetching more conversations (fallback):', fallbackError);
          return;
        }

        // Procesar los datos del fallback
        const processedConversations = (fallbackData || []).map(conv => {
          const lastMessageDate = conv.mensajes_xt_mkt?.length > 0 
            ? Math.max(...conv.mensajes_xt_mkt.map((m: { fecha: string }) => new Date(m.fecha).getTime()))
            : new Date(conv.updated_at).getTime();
          
          return {
            ...conv,
            real_last_message_date: new Date(lastMessageDate).toISOString(),
            mensajes_xt_mkt: undefined // Limpiar para no sobrecargar el estado
          };
        });

        const newConversations = processedConversations || [];
        
        if (newConversations.length > 0) {
          setConversations(prev => {
            const updatedConversations = [...prev, ...newConversations];
            // Ordenar por fecha del último mensaje real
            return updatedConversations.sort((a: Conversacion & { real_last_message_date?: string }, b: Conversacion & { real_last_message_date?: string }) => {
              const dateA = new Date(a.real_last_message_date || a.updated_at || 0);
              const dateB = new Date(b.real_last_message_date || b.updated_at || 0);
              return dateB.getTime() - dateA.getTime();
            });
          });
          setCurrentPage(prev => prev + 1);
        }
        
        // Verificar si hay más conversaciones
        setHasMoreConversations(newConversations.length === CONVERSATIONS_PER_PAGE);
        
      } else if (conversationsError) {
        console.error('Error fetching more conversations:', conversationsError);
      } else {
        const newConversations = conversationsData || [];
        
        if (newConversations.length > 0) {
          setConversations(prev => {
            const updatedConversations = [...prev, ...newConversations];
            // Ordenar por fecha del último mensaje real
            return updatedConversations.sort((a, b) => {
              const dateA = new Date(a.real_last_message_date || a.updated_at || 0);
              const dateB = new Date(b.real_last_message_date || b.updated_at || 0);
              return dateB.getTime() - dateA.getTime();
            });
          });
          setCurrentPage(prev => prev + 1);
        }
        
        // Verificar si hay más conversaciones
        setHasMoreConversations(newConversations.length === CONVERSATIONS_PER_PAGE);
      }
      
    } catch (error) {
      console.error('Error in fetchMoreConversations:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMoreConversations, loadingConversations, loadingMore, isSearching]);

  // Función para buscar conversaciones
  const searchConversations = useCallback(async (term: string) => {
    // Cancelar búsqueda anterior si existe
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    // Crear nuevo controlador para esta búsqueda
    searchAbortControllerRef.current = new AbortController();
    const { signal } = searchAbortControllerRef.current;

    if (!term.trim()) {
      setSearchResults({ conversaciones: [], mensajes: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase
        .from('conversaciones_xt_mkt')
        .select('*')
        .or(
          `numero.ilike.%${term}%,nombre_contacto.ilike.%${term}%,ultimo_mensaje_resumen.ilike.%${term}%`
        )
        .order('updated_at', { ascending: false })
        .limit(20)
        .abortSignal(signal);

      if (error) {
        if (error.name !== 'AbortError') {
          console.error('Error searching conversations:', error);
        }
        return;
      }

      setSearchResults({ conversaciones: data || [], mensajes: [] });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error in searchConversations:', error);
      }
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  // Limpiar búsqueda (alineado con el repo base)
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults({ conversaciones: [], mensajes: [] });
    setIsSearching(false);
  }, []);

  // Función para reordenar conversaciones cuando llega un nuevo mensaje
  const sortConversationsByLatestMessage = useCallback((conversationId: number, messageDate: string) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            updated_at: messageDate,
            real_last_message_date: messageDate
          };
        }
        return conv;
      });
      
      // Reordenar por fecha del último mensaje
      return updated.sort((a, b) => {
        const dateA = new Date((a as any).real_last_message_date || a.updated_at || 0);
        const dateB = new Date((b as any).real_last_message_date || b.updated_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    });
    setJustUpdatedConvId(conversationId);
  }, []);

  // Marcar conversación como leída en la lista (sincrónico en estado)
  const markConversationAsRead = useCallback((conversationId: number) => {
    setConversations(prev => prev.map(c => c.id === conversationId ? {
      ...c,
      tiene_no_leidos: false,
      no_leidos_count: 0,
      updated_at: c.updated_at
    } : c));
  }, []);

  // Manejar cambios en el término de búsqueda debounced
  useEffect(() => {
    if (debouncedSearchTerm !== previousSearchTerm.current) {
      searchConversations(debouncedSearchTerm);
      previousSearchTerm.current = debouncedSearchTerm;
    }
  }, [debouncedSearchTerm, searchConversations]);

  // Cargar conversaciones al montar el componente
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Función para limpiar controladores de búsqueda
  useEffect(() => {
    return () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Agregar polling como backup para actualizaciones en tiempo real
  useEffect(() => {
    // Solo hacer polling si no estamos en búsqueda y tenemos conversaciones cargadas
    if (isSearching || conversations.length === 0) {
      return;
    }

    console.log('[useConversations] Setting up polling for conversation updates...');
    
    const pollInterval = setInterval(async () => {
      console.log('[useConversations] Polling for conversation updates...');
      
      try {
        // Hacer una consulta rápida para obtener solo las últimas actualizaciones
        const { data: recentUpdates, error } = await supabase
          .from('conversaciones_xt_mkt')
          .select('id, updated_at, ultimo_mensaje_resumen, tiene_no_leidos, no_leidos_count')
          .order('updated_at', { ascending: false })
          .limit(10); // Solo los 10 más recientes

        if (error) {
          console.error('Error in polling:', error);
          return;
        }

        // Actualizar conversaciones existentes con nueva información
        if (recentUpdates && recentUpdates.length > 0) {
          setConversations(prev => {
            let hasChanges = false;
            const updated = prev.map(conv => {
              const recentUpdate = recentUpdates.find(ru => ru.id === conv.id);
              if (recentUpdate && new Date(recentUpdate.updated_at) > new Date(conv.updated_at)) {
                hasChanges = true;
                return {
                  ...conv,
                  ...recentUpdate
                };
              }
              return conv;
            });

            // Solo actualizar si hay cambios reales
            return hasChanges ? updated : prev;
          });
        }
      } catch (error) {
        console.error('Error in polling conversations:', error);
      }
    }, 30000); // Poll cada 30 segundos

    return () => {
      console.log('[useConversations] Cleaning up polling interval...');
      clearInterval(pollInterval);
    };
  }, [isSearching, conversations.length]);

  // Suscripción en tiempo real para mensajes nuevos (como backup)
  useEffect(() => {
    if (isSearching) {
      return;
    }

    console.log('[useConversations] Setting up real-time subscription for new messages...');

    const handleNewMessage = (payload: any) => {
      if (onNewMessageReceived) {
        onNewMessageReceived(payload.new);
      }
      
      // Reordenar conversaciones basado en el nuevo mensaje
      if (payload.new?.conversation_id && payload.new?.fecha) {
        sortConversationsByLatestMessage(payload.new.conversation_id, payload.new.fecha);
      }
      
      // Si el mensaje es de una conversación que no tenemos cargada, puede que necesitemos refrescar
      const conversationExists = conversations.some(conv => conv.id === payload.new?.conversation_id);
      if (!conversationExists && payload.new?.conversation_id) {
        console.log('New conversation detected, might need to refresh list');
      }
      
      return prev;
    };

    const channel = supabase
      .channel('mensajes_xt_mkt_global_subscription')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mensajes_xt_mkt' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            handleNewMessage(payload);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Global message ANY change subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to message changes.');
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Realtime connection temporarily unavailable, using polling fallback');
          // No mostrar error crítico, solo advertencia - el polling maneja la funcionalidad
        }
      });

    return () => {
      console.log('Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  }, [onNewMessageReceived, sortConversationsByLatestMessage]);

  return {
    conversations,
    selectedConversation,
    searchTerm,
    isSearching,
    searchResults,
    loadingConversations,
    loadingMore,
    hasMoreConversations,
    totalConversations,
    justUpdatedConvId,
    setSelectedConversation,
    setSearchTerm,
    fetchMoreConversations,
    // Exponer fetch para que App.tsx pueda alias como refetchConversations
    fetchConversations,
    // utilidades alineadas con el repo
    clearSearch,
    markConversationAsRead,
    // Función para refrescar las conversaciones manualmente
    refreshConversations: fetchConversations
  };
}