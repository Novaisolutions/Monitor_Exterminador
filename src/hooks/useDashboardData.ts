import { useState, useEffect } from 'react';
import { Mensaje, Conversacion } from '../types/database';

interface DashboardStats {
  totalMessages: number;
  respondedMessages: number;
  averageResponseTime: string; // Podría calcularse más adelante
  activeChats: number;
  staleConversations: number;
}

interface KeywordData {
  word: string;
  count: number;
}

function useDashboardData(allMessages: Mensaje[], conversations: Conversacion[]) {
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    respondedMessages: 0,
    averageResponseTime: 'N/A', // Inicializar
    activeChats: 0,
    staleConversations: 0
  });
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [criticalCount, setCriticalCount] = useState<number>(0);

  // Calcular estadísticas generales
  useEffect(() => {
    const total = allMessages.length;
    // Asumiendo que 'leido' en el mensaje implica respondido
    const responded = allMessages.filter(m => m.leido && m.tipo === 'entrada').length; 
    const active = conversations.filter(c => c.tiene_no_leidos).length;
    
    const staleThresholdMs = 60 * 60 * 1000; // 1 hora
    const stale = conversations.filter(c =>
      c.tiene_no_leidos &&
      c.updated_at && // Asegurarse de que updated_at exista
      (Date.now() - new Date(c.updated_at).getTime()) > staleThresholdMs
    ).length;

    setStats({
      totalMessages: total,
      respondedMessages: responded,
      averageResponseTime: '5min', // Placeholder
      activeChats: active,
      staleConversations: stale
    });
  }, [allMessages, conversations]);

  // Extraer palabras clave y contar mensajes críticos
  useEffect(() => {
    if (allMessages.length === 0) {
      setKeywords([]);
      setCriticalCount(0);
      return;
    }

    const stopWords = ['de','la','el','que','y','a','en','los','del','se','las','por','un','para','con','no','una','su','al','es','lo','como','más','pero','sus','le','ya','o','este','sí','porque','esta','entre','cuando','muy','sin','sobre','también','me','hasta','hay','donde','quien','desde','todo','nos','durante','todos','uno','les','ni','contra','otros','ese','eso','ante','ellos','e','esto','mí','antes','algunos','qué','unos', 'q', '?', ''];
    const freqMap: Record<string, number> = {};
    
    allMessages.forEach(msg => {
      if (!msg || !msg.mensaje) return; // Comprobación de nulidad
      msg.mensaje
        .toLowerCase()
        .replace(/[^\w\sáéíóúüñ]/g, '') // Limpiar caracteres especiales
        .split(/\s+/)
        .filter(w => w && w.length > 2 && !stopWords.includes(w)) // Filtrar palabras cortas y stopwords
        .forEach(w => {
          freqMap[w] = (freqMap[w] || 0) + 1;
        });
    });
    
    const sortedKeywords = Object.entries(freqMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 keywords
      
    setKeywords(sortedKeywords);

    // Contar mensajes críticos (ejemplo)
    const criticalWords = ['urgente', 'problema', 'reclamo', 'error', 'fallo', 'molesto'];
    const criticalMessagesCount = allMessages.filter(msg =>
      msg && msg.mensaje && criticalWords.some(cw => msg.mensaje.toLowerCase().includes(cw))
    ).length;
    setCriticalCount(criticalMessagesCount);

  }, [allMessages]);

  return { stats, keywords, criticalCount };
}

export default useDashboardData; 