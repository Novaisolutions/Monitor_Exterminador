import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ProspectoMkt } from '../types/database';
import { normalizeEstadoEmbudo } from '../lib/utils'; // Importar la función experta

// Ya no es necesario un tipo básico, usaremos ProspectoMkt directamente.

// Estado para gestionar qué campos se resaltan temporalmente
// Formato: { prospectoId: Set<keyof ProspectoMkt> }
type HighlightedFields = Record<number, Set<keyof ProspectoMkt>>;

// --- Función de Normalización Robusta ---
// Usa la función centralizada para normalizar el estado del embudo.
const normalizeProspecto = (prospecto: ProspectoMkt): ProspectoMkt => {
  return {
    ...prospecto,
    estado_embudo: normalizeEstadoEmbudo(prospecto.estado_embudo),
  };
};

function useProspectos() {
  const [prospectos, setProspectos] = useState<ProspectoMkt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<HighlightedFields>({});

  // Función para resaltar un campo y quitar el resaltado después de un tiempo
  const highlightChanges = (prospectoId: number, fields: Set<keyof ProspectoMkt>) => {
    setHighlightedFields(prev => ({ ...prev, [prospectoId]: fields }));
    setTimeout(() => {
      setHighlightedFields(prev => {
        const newHighlights = { ...prev };
        delete newHighlights[prospectoId];
        return newHighlights;
      });
    }, 2500); // Duración del resaltado en milisegundos
  };

  // Función para obtener todos los prospectos ordenados por último mensaje
  const fetchProspectos = useCallback(async () => {
    console.log('[useProspectos] Fetching prospectos ordenados por último mensaje...');
    setLoading(true);
    setError(null);
    
    try {
      // Usar la función RPC optimizada para obtener prospectos ordenados por actividad reciente
      const { data, error: fetchError } = await supabase.rpc('get_prospectos_with_last_message_date');

      // Si la RPC falla por cualquier razón, usar fallback directo a la tabla
      if (fetchError) {
        console.warn('[useProspectos] RPC falló, usando fallback a prospectos_xt_mkt. Detalles:', fetchError);
        const { data: fbData, error: fbErr } = await supabase
          .from('prospectos_xt_mkt')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(200);
        if (fbErr) {
          console.error('[useProspectos] Error en fallback:', fbErr);
          setError(fbErr.message);
          setProspectos([]);
        } else {
          const normalizedData = (fbData || []).map(normalizeProspecto);
          setProspectos(normalizedData);
        }
      } else {
        console.log(`[useProspectos] Successfully fetched ${data?.length ?? 0} prospectos ordenados por actividad.`);
        // Normalizar los datos al recibirlos - la función RPC ya retorna el orden correcto
        const normalizedData = (data || []).map(normalizeProspecto);
        setProspectos(normalizedData);
      }
    } catch (catchError: any) {
      console.error('[useProspectos] Exception during fetch:', catchError);
      setError(catchError.message || 'Error desconocido');
      setProspectos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para crear un nuevo prospecto
  const createProspecto = useCallback(async (prospectoData: Partial<ProspectoMkt>) => {
    console.log('[useProspectos] Creating new prospecto:', prospectoData);
    setError(null);
    
    // Asegurarse de que los campos obligatorios tienen valores
    if (!prospectoData.nombre || !prospectoData.numero_telefono) {
      const errMsg = "El nombre y el número de teléfono son obligatorios para crear un prospecto.";
      console.error(`[useProspectos] ${errMsg}`);
      setError(errMsg);
      return null;
    }

    try {
      // Combinar con valores por defecto para campos de IA si no están definidos
      const prospectoCompleto = {
        ...prospectoData,
        estado_embudo: prospectoData.estado_embudo || 'lead',
        prioridad: prospectoData.prioridad || 'media',
        sentimiento_conversacion: prospectoData.sentimiento_conversacion || 'neutral',
        score_interes: prospectoData.score_interes || 50,
        probabilidad_conversion: prospectoData.probabilidad_conversion || 30,
        notas_manuales: prospectoData.notas_manuales || [],
      };

      const { data, error: insertError } = await supabase
        .from('prospectos_xt_mkt')
        .insert([prospectoCompleto])
        .select()
        .single();
        
      if (insertError) {
        console.error('[useProspectos] Error creating prospecto:', insertError);
        setError(insertError.message);
        return null;
      } else {
        console.log('[useProspectos] Prospecto created successfully (not adding to state, relying on realtime).');
        // No es necesario añadirlo al estado manualmente, el listener de realtime se encargará.
        return data;
      }
    } catch (catchError: any) {
      console.error('[useProspectos] Exception during create:', catchError);
      setError(catchError.message || 'Error desconocido');
      return null;
    }
  }, []);

  // Función unificada para actualizar cualquier campo de un prospecto
  const updateProspecto = useCallback(async (id: number, updates: Partial<ProspectoMkt>) => {
    console.log('[useProspectos] Updating prospecto:', id, updates);
    setError(null);
    
    try {
      const { data, error: updateError } = await supabase
        .from('prospectos_xt_mkt')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (updateError) {
        console.error('[useProspectos] Error updating prospecto:', updateError);
        setError(updateError.message);
        return null;
      } else {
        console.log('[useProspectos] Prospecto updated successfully (not updating state, relying on realtime).');
        // El listener de realtime se encargará de la actualización del estado.
        return data;
      }
    } catch (catchError: any) {
      console.error('[useProspectos] Exception during update:', catchError);
      setError(catchError.message || 'Error desconocido');
      return null;
    }
  }, []);

  // Se elimina 'updateProspectoCRM' ya que 'updateProspecto' ahora maneja todos los campos.

  // Función para eliminar un prospecto
  const deleteProspecto = useCallback(async (id: number) => {
    console.log('[useProspectos] Deleting prospecto:', id);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('prospectos_xt_mkt')
        .delete()
        .eq('id', id);
        
      if (deleteError) {
        console.error('[useProspectos] Error deleting prospecto:', deleteError);
        setError(deleteError.message);
        return false;
      } else {
        console.log('[useProspectos] Prospecto deleted successfully (not removing from state, relying on realtime).');
        // El listener de realtime se encargará de eliminarlo del estado.
        return true;
      }
    } catch (catchError: any) {
      console.error('[useProspectos] Exception during delete:', catchError);
      setError(catchError.message || 'Error desconocido');
      return false;
    }
  }, []);

  // Efecto para cargar datos iniciales y suscribirse a cambios en tiempo real.
  useEffect(() => {
    // 1. Carga inicial de datos.
    fetchProspectos();

    // 2. Suscripción a cambios en la tabla 'prospectos_xt_mkt'.
    const channel = supabase
      .channel('prospectos-xt-mkt-realtime-channel')
      .on<ProspectoMkt>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prospectos_xt_mkt' },
        (payload) => {
          console.log('[Realtime] Change received!', payload);

          if (payload.eventType === 'INSERT') {
            const newProspecto = normalizeProspecto(payload.new); // Normalizar
            setProspectos(currentProspectos => 
              [newProspecto, ...currentProspectos]
            );
            highlightChanges(newProspecto.id, new Set(['nombre', 'estado_embudo']));
          }

          if (payload.eventType === 'UPDATE') {
            const updatedProspecto = normalizeProspecto(payload.new); // Normalizar
            const oldProspecto = payload.old;
            
            const changedFields = new Set<keyof ProspectoMkt>();
            // Compara los campos para ver qué ha cambiado.
            Object.keys(updatedProspecto).forEach(key => {
              const typedKey = key as keyof ProspectoMkt;
              if (JSON.stringify(updatedProspecto[typedKey]) !== JSON.stringify(oldProspecto[typedKey])) {
                changedFields.add(typedKey);
              }
            });

            setProspectos(currentProspectos =>
              currentProspectos.map(p => (p.id === updatedProspecto.id ? updatedProspecto : p))
            );
            
            if (changedFields.size > 0) {
              highlightChanges(updatedProspecto.id, changedFields);
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedProspectoId = payload.old.id; // No necesita normalización
            setProspectos(currentProspectos =>
              currentProspectos.filter(p => p.id !== deletedProspectoId)
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to prospectos_xt_mkt changes!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Subscription failed.');
          setError('Error de conexión en tiempo real.');
        }
      });

    // 3. Función de limpieza para desuscribirse cuando el componente se desmonte.
    return () => {
      console.log('[Realtime] Unsubscribing from channel.');
      supabase.removeChannel(channel);
    };
  }, [fetchProspectos]);

  return {
    prospectos,
    loading,
    error,
    highlightedFields, // Devolver los campos resaltados
    fetchProspectos,
    createProspecto,
    updateProspecto,
    deleteProspecto,
    clearError: () => setError(null)
  };
}

export default useProspectos; 