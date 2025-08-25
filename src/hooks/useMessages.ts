import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Mensaje } from '../types/database';

interface UseMessagesOptions {
  conversationId: number | null;
  onMessageReceived?: (message: Mensaje) => void;
  // Ref al contenedor scrollable que muestra los mensajes (div con overflow)
  scrollContainerRef?: React.RefObject<HTMLElement | null> | React.RefObject<HTMLDivElement | null>;
}

export default function useMessages({ conversationId, onMessageReceived, scrollContainerRef }: UseMessagesOptions = { conversationId: null }) {
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messageInput, setMessageInput] = useState<string>('');

  // Mantener un ref con el id actual para evitar recrear funciones
  const currentIdRef = useRef<number | null>(null);
  // Cursor para paginación (fecha del mensaje más antiguo cargado)
  const oldestFechaRef = useRef<string | null>(null);
  // Última fecha conocida para traer solo nuevos mensajes en polling
  const latestFechaRef = useRef<string | null>(null);
  // Control de primer cargado para hacer scroll al final
  const initialLoadDoneRef = useRef<boolean>(false);
  const PAGE_SIZE = 15;

  // Helper: easing y animación para scroll
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const animateScrollTo = useCallback((toY: number, duration = 450) => {
    const container = scrollContainerRef?.current ?? (messagesEndRef.current?.parentElement as HTMLElement | null);
    if (!container) return;
    const startY = container.scrollTop;
    const deltaY = Math.max(0, toY - startY);
    if (deltaY === 0 || duration <= 0) {
      container.scrollTop = toY;
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      container.scrollTop = startY + deltaY * eased;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [scrollContainerRef]);

  // Función para cargar mensajes de una conversación (estable)
  const fetchMessages = useCallback(async (convId: number | null) => {
    if (!convId || convId === currentIdRef.current) return;

    console.log(`(useMessages) Cargando últimos ${PAGE_SIZE} mensajes para conversación: ${convId}`);
    setLoadingMessages(true);
    setCurrentConversationId(convId);
    currentIdRef.current = convId;
    oldestFechaRef.current = null;
    latestFechaRef.current = null;
    initialLoadDoneRef.current = false;
    setHasMoreMessages(false);

    try {
      const limitPlus = PAGE_SIZE + 1;
      const { data, error } = await supabase
        .from('mensajes_xt_mkt')
        .select('*')
        .eq('conversation_id', convId)
        .order('fecha', { ascending: false })
        .limit(limitPlus);

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } else {
        const rows = data || [];
        const hasMore = rows.length > PAGE_SIZE;
        const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
        // Convertir a ascendente para render natural
        const ascending = [...page].reverse();
        setMessages(ascending);
        setHasMoreMessages(hasMore);
        if (ascending.length > 0) {
          oldestFechaRef.current = ascending[0].fecha as unknown as string;
          latestFechaRef.current = ascending[ascending.length - 1].fecha as unknown as string;
        } else {
          oldestFechaRef.current = null;
          latestFechaRef.current = null;
        }
        console.log(`(useMessages) Cargados ${ascending.length} mensajes (hasMore=${hasMore})`);
        // Marcar que el primer cargado terminó para hacer scroll al final
        initialLoadDoneRef.current = true;
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Cargar más (mensajes más antiguos)
  const fetchMoreMessages = useCallback(async () => {
    if (!currentConversationId || !oldestFechaRef.current || loadingMore) return;
    setLoadingMore(true);
    // Preservar posición de scroll para evitar "saltos" al prepender
    const container = scrollContainerRef?.current ?? (messagesEndRef.current?.parentElement as HTMLElement | null);
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;
    try {
      const limitPlus = PAGE_SIZE + 1;
      const { data, error } = await supabase
        .from('mensajes_xt_mkt')
        .select('*')
        .eq('conversationId', currentConversationId)
        .lt('fecha', oldestFechaRef.current)
        .order('fecha', { ascending: false })
        .limit(limitPlus);

      if (error) {
        console.error('Error fetching more messages:', error);
        return;
      }

      const rows = data || [];
      const hasMore = rows.length > PAGE_SIZE;
      const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
      const ascending = [...page].reverse();

      setMessages(prev => {
        if (ascending.length === 0) return prev;
        const next = [...ascending, ...prev];
        return next;
      });

      if (ascending.length > 0) {
        oldestFechaRef.current = ascending[0].fecha as unknown as string;
      }
      setHasMoreMessages(hasMore);
      console.log(`(useMessages) fetchMore: añadidos ${ascending.length}, hasMore=${hasMore}`);
      // Ajustar scrollTop para mantener el mismo mensaje en la misma posición visual
      if (container) {
        // Esperar a que React pinte
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          const delta = newScrollHeight - prevScrollHeight;
          container.scrollTop = prevScrollTop + delta;
        });
      }
    } catch (e) {
      console.error('Error in fetchMoreMessages:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [currentConversationId, loadingMore]);

  // Función para enviar un nuevo mensaje
  const sendMessage = useCallback(async (conversationId: number, mensaje: string, tipo: 'entrada' | 'salida' = 'salida') => {
    if (!conversationId || !mensaje.trim()) return null;

    try {
      const { data, error } = await supabase
        .from('mensajes_xt_mkt')
        .insert({
          conversation_id: conversationId,
          mensaje: mensaje.trim(),
          tipo,
          fecha: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      console.log('(useMessages) Mensaje enviado exitosamente:', data);
      
      // Agregar el mensaje localmente sin esperar a la suscripción
      setMessages(prevMessages => {
        if (prevMessages.some(msg => msg.id === data.id)) {
          return prevMessages;
        }
        return [...prevMessages, data];
      });

      // Notificar al componente padre si se proporciona callback
      if (onMessageReceived) {
        onMessageReceived(data);
      }

      return data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  }, [onMessageReceived]);

  // (Eliminado: función duplicada de markMessagesAsRead)

  // Configurar suscripción en tiempo real para mensajes de la conversación actual
  useEffect(() => {
    if (!currentConversationId) {
      return;
    }

    console.log(`(useMessages) Configurando suscripción para conversation_id: ${currentConversationId}`);

    const channel = supabase
      .channel(`mensajes_xt_mkt_conv_${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_xt_mkt',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          console.log('(useMessages) Nuevo mensaje recibido en tiempo real:', payload);
          const newMessage = payload.new as Mensaje;
     setMessages(currentMessages => {
            if (currentMessages.some(msg => msg.id === newMessage.id)) {
              return currentMessages;
            }
            return [...currentMessages, newMessage];
          });
          // Actualizar última fecha conocida para optimizar polling
          try { latestFechaRef.current = newMessage.fecha as unknown as string; } catch {}
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ (useMessages) Suscrito con éxito a la conversación ${currentConversationId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.warn(`⚠️ (useMessages) Realtime temporalmente no disponible para conversación ${currentConversationId}, usando polling`);
          // El sistema de polling automático maneja la funcionalidad cuando Realtime falla
        }
      });

    return () => {
      console.log(`(useMessages) Limpiando suscripción para la conversación ${currentConversationId}`);
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

  // Marcar mensajes como leídos (única definición)
  const markMessagesAsRead = useCallback(async (conversationId: number) => {
    if (!conversationId) return;
    try {
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.tipo === 'entrada') {
            return { ...msg, leido: true };
          }
          return msg;
        })
      );

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('conversaciones_xt_mkt')
        .update({ 
          tiene_no_leidos: false,
          no_leidos_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
    }
  }, []);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (conversationId && conversationId !== currentIdRef.current) {
      fetchMessages(conversationId);
    } else if (!conversationId) {
      setMessages([]);
      setCurrentConversationId(null);
      currentIdRef.current = null;
      oldestFechaRef.current = null;
      latestFechaRef.current = null;
      initialLoadDoneRef.current = false;
      setHasMoreMessages(false);
    }
  }, [conversationId, fetchMessages]);

  // Configurar polling como backup
  useEffect(() => {
    if (!currentConversationId) {
      return;
    }

    // Polling cada 10 segundos como backup
    const pollInterval = setInterval(async () => {
      try {
        if (!latestFechaRef.current) return;
        const { data, error } = await supabase
          .from('mensajes_xt_mkt')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .gt('fecha', latestFechaRef.current)
          .order('fecha', { ascending: true });

        if (!error && data && data.length > 0) {
          setMessages(prevMessages => {
            const newMessages = data.filter(newMsg => 
              !prevMessages.some(prevMsg => prevMsg.id === newMsg.id)
            );
            if (newMessages.length > 0) {
              console.log(`(useMessages) Polling detected ${newMessages.length} new messages`);
              try { latestFechaRef.current = newMessages[newMessages.length - 1].fecha as unknown as string; } catch {}
              return [...prevMessages, ...newMessages];
            }
            return prevMessages;
          });
        }
      } catch (error) {
        console.error('Error in polling messages:', error);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [currentConversationId]);

  // Auto-scroll al final tras el primer cargado o al recibir nuevos mensajes
  useEffect(() => {
    if (!messagesEndRef.current) return;
    if (initialLoadDoneRef.current) {
      // Hacer scroll animado al final y resetear la bandera
      const container = scrollContainerRef?.current ?? (messagesEndRef.current.parentElement as HTMLElement | null);
      if (container) {
        animateScrollTo(container.scrollHeight, 500);
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      initialLoadDoneRef.current = false;
    }
  }, [messages.length]);

  const scrollToEnd = useCallback(() => {
    const container = scrollContainerRef?.current ?? (messagesEndRef.current?.parentElement as HTMLElement | null);
    if (container) {
      animateScrollTo(container.scrollHeight, 500);
      return;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [animateScrollTo, scrollContainerRef]);

  const handleSendMessage = useCallback((convId: number, text: string) => {
    return sendMessage(convId, text, 'salida');
  }, [sendMessage]);

  const loadingInitial = loadingMessages;

  return {
    messages,
    loadingInitial,
    loadingMore,
    hasMoreMessages,
    messagesEndRef,
    scrollToEnd,
    messageInput,
    setMessageInput,
    markMessagesAsRead,
    handleSendMessage,
    fetchMessages,
    fetchMoreMessages,
  };
}