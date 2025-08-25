import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type ProximoSeguimiento = {
  conversation_id: number;
  numero: string;
  numeroFormateado: string;
  nombreProspecto: string;
  tiempoRestante: string;
  tiempoRestanteMinutos: number;
  estado_embudo?: string | null;
};

type SeguimientoStats = {
  proximaHora: number;
  activos: number;
  programadosHoy: number;
  proximosSeguimientos: ProximoSeguimiento[];
  ultimaActualizacion: string;
};

function formatNumberMX(num: string) {
  const cleaned = (num || '').replace(/\D/g, '');
  if (cleaned.startsWith('521')) {
    return `+52 ${cleaned.slice(2,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('52')) {
    return `+52 ${cleaned.slice(2,5)} ${cleaned.slice(5,8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.length === 10) {
    return `+52 ${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6)}`;
  }
  return num || '';
}

export function useSeguimientoStats() {
  const [loading, setLoading] = useState<boolean>(false);
  const [rawSeguimientos, setRawSeguimientos] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('es-MX'));

  const fetchSeguimientos = useCallback(async () => {
    setLoading(true);
    try {
      // Usar la nueva función que solo muestra conversaciones pendientes de envío webhook
      const { data, error } = await supabase.rpc('obtener_conversaciones_seguimiento_simple');

      if (error) {
        console.error('[useSeguimientoStats] Error fetching:', error);
        setRawSeguimientos([]);
      } else {
        setRawSeguimientos(data || []);
      }
      setLastUpdated(new Date().toLocaleTimeString('es-MX'));
    } catch (e) {
      console.error('[useSeguimientoStats] Exception:', e);
      setRawSeguimientos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeguimientos();
    const i = setInterval(fetchSeguimientos, 60_000);
    return () => clearInterval(i);
  }, [fetchSeguimientos]);

  const stats: SeguimientoStats = useMemo(() => {
    const now = new Date();
    const proximosSeguimientos: ProximoSeguimiento[] = (rawSeguimientos || []).map((c) => {
      // La nueva función RPC devuelve proximo_seguimiento_calculado
      const target = c.proximo_seguimiento_calculado ? new Date(c.proximo_seguimiento_calculado) : now;
      const diffMin = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
      const tiempoRestante = diffMin <= 0 ? '¡Ahora!' : diffMin < 60 ? `${diffMin}m` : `${Math.floor(diffMin/60)}h ${diffMin%60}m`;
      return {
        conversation_id: c.conversation_id,
        numero: c.numero,
        numeroFormateado: formatNumberMX(c.numero || ''),
        nombreProspecto: c.nombre_contacto || 'Prospecto',
        tiempoRestante,
        tiempoRestanteMinutos: diffMin,
        estado_embudo: 'lead' // La nueva función no incluye estado_embudo, usar default
      };
    });

    const proximaHora = proximosSeguimientos.filter(s => s.tiempoRestanteMinutos <= 60).length;
    const activos = proximosSeguimientos.length;
    const programadosHoy = proximosSeguimientos.filter(s => {
      const d = rawSeguimientos.find(x => x.conversation_id === s.conversation_id)?.proximo_seguimiento_calculado;
      if (!d) return false;
      const dt = new Date(d);
      const today = new Date();
      return dt.getFullYear() === today.getFullYear() && dt.getMonth() === today.getMonth() && dt.getDate() === today.getDate();
    }).length;

    return {
      proximaHora,
      activos,
      programadosHoy,
      proximosSeguimientos,
      ultimaActualizacion: lastUpdated,
    };
  }, [rawSeguimientos, lastUpdated]);

  const refresh = useCallback(() => {
    fetchSeguimientos();
  }, [fetchSeguimientos]);

  return { stats, loading, refresh };
}



