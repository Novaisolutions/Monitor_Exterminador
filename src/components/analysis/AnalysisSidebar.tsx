import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Conversacion } from '../../types/database';
import { Button } from '@/components/ui/button'; // Usar alias @
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Usar alias @

interface AnalysisSidebarProps {
  conversations: Conversacion[];
  fetchConversations: () => Promise<void>;
}

interface AnalysisState {
  loading: boolean;
  error: string | null;
}

const AnalysisSidebar: React.FC<AnalysisSidebarProps> = ({ conversations, fetchConversations }) => {
  const [analysisStates, setAnalysisStates] = useState<Record<number, AnalysisState>>({});

  const handleAnalyze = async (conversationId: number) => {
    setAnalysisStates(prev => ({
      ...prev,
      [conversationId]: { loading: true, error: null }
    }));

    try {
      // Intentar forzar refresco de sesión/token
      console.log("Forzando refresco de sesión...");
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Error al intentar refrescar sesión:", refreshError);
        // Podríamos lanzar un error aquí o intentar continuar con el token viejo
        // throw new Error("No se pudo validar la sesión."); 
      }
      
      // Loguear el token actual DESPUÉS del intento de refresco
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error obteniendo sesión después de refresco:", sessionError);
      } else {
        console.log("JWT Token DESPUÉS de refresco:", session?.access_token);
        if (!session?.access_token) {
           throw new Error("No hay token de acceso válido después del refresco.");
        }
      }
      
      console.log(`Invoking summarize-conversation for conversation ID: ${conversationId}`);
      // La llamada a invoke usará automáticamente el token más reciente de la sesión
      const { data, error: functionError } = await supabase.functions.invoke('summarize-conversation', {
        body: { conversation_id: conversationId },
      });

      if (functionError) {
        console.error('Error invoking Edge Function:', functionError);
        throw new Error(functionError.message || 'Error al analizar la conversación.');
      }

      if (data && data.error) {
        console.error('Error from Edge Function logic:', data.error);
        throw new Error(data.error);
      }

      console.log('Analysis successful for conversation:', conversationId, 'Data:', data);
      await fetchConversations(); // Refresca la lista para mostrar el nuevo resumen

    } catch (error: any) {
      console.error('Analysis failed for conversation:', conversationId, error);
      setAnalysisStates(prev => ({
        ...prev,
        [conversationId]: { loading: false, error: error.message || 'Ocurrió un error inesperado.' }
      }));
      // No necesitas limpiar el loading aquí si el fetch tiene éxito,
      // porque el estado se reiniciará con el nuevo renderizado de conversaciones.
      // Pero si el fetch falla o no actualiza este ID específico, necesitamos limpiar el estado.
      // Una forma segura es limpiarlo siempre después del fetch o manejarlo más finamente.
      // Por simplicidad, lo limpiamos después del fetch (aunque fetch puede no actualizar inmediatamente)
      // o si hay un error.
    } finally {
      // Asegurarse de limpiar el estado de carga si no hubo error que lo hiciera ya
      // Y si fetchConversations no causo un re-render que naturalmente limpiaría el estado.
      // Este finally asegura que el loading se quite eventualmente.
      setAnalysisStates(prev => {
        // Solo actualiza si aún existe la entrada y está cargando (por si fetch ya actualizó)
        if (prev[conversationId]?.loading) {
          return {
            ...prev,
            // Mantenemos el error si existió, si no, limpiamos loading y error.
            [conversationId]: { ...prev[conversationId], loading: false }
          };
        }
        return prev;
      });
    }
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold mb-4">Análisis de Conversaciones</h2>
      {conversations.length === 0 ? (
        <p>No hay conversaciones para analizar.</p>
      ) : (
        conversations.map((convo) => {
          const state = analysisStates[convo.id] || { loading: false, error: null };
          return (
            <Card key={convo.id}>
              <CardHeader>
                <CardTitle>Conversación: {convo.numero || convo.id}</CardTitle>
                <CardDescription>
                  Estado: {convo.status} {convo.tiene_no_leidos ? '(Nuevos mensajes)' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {convo.resumen_ia ? (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Resumen IA:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{convo.resumen_ia}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay resumen disponible.</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-2">
                <Button
                  onClick={() => handleAnalyze(convo.id)}
                  disabled={state.loading}
                  size="sm"
                  variant="outline"
                >
                  {state.loading ? 'Analizando...' : 'Analizar Conversación'}
                </Button>
                {state.error && (
                  <p className="text-red-500 text-xs mt-1">Error: {state.error}</p>
                )}
              </CardFooter>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default AnalysisSidebar; 