import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log("🔄 Exterminador Seguimiento iniciado");

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Buscando conversaciones que requieren seguimiento...');

    // Obtener conversaciones que necesitan seguimiento de 4 horas
    const { data: conversaciones, error: errorConversaciones } = await supabase
      .from('conversaciones_xt_mkt')
      .select(`
        id,
        numero,
        ultimo_mensaje_entrada_fecha,
        necesita_seguimiento_4h,
        reactivacion_intentos,
        prospectos_xt_mkt!inner(
          id,
          nombre,
          estado_embudo,
          plaga_a_erradicar,
          resumen_ia,
          urgencia_detectada
        )
      `)
      .eq('necesita_seguimiento_4h', true)
      .lt('proximo_seguimiento_4h', new Date().toISOString())
      .limit(10);

    if (errorConversaciones) {
      console.error('❌ Error obteniendo conversaciones:', errorConversaciones);
      return new Response(JSON.stringify({ error: errorConversaciones.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`📊 Encontradas ${conversaciones?.length || 0} conversaciones para seguimiento`);

    if (!conversaciones || conversaciones.length === 0) {
      return new Response(JSON.stringify({
        message: 'No hay conversaciones que requieran seguimiento',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resultados = [];

    for (const conversacion of conversaciones) {
      try {
        console.log(`⚡ Procesando seguimiento para ${conversacion.numero}`);

        // Obtener últimos 10 mensajes para contexto
        const { data: mensajes, error: errorMensajes } = await supabase
          .from('mensajes_xt_mkt')
          .select('tipo, mensaje, fecha')
          .eq('conversation_id', conversacion.id)
          .order('fecha', { ascending: false })
          .limit(10);

        if (errorMensajes) {
          console.error(`❌ Error obteniendo mensajes para ${conversacion.numero}:`, errorMensajes);
          continue;
        }

        // Calcular horas transcurridas
        const horasTranscurridas = conversacion.ultimo_mensaje_entrada_fecha 
          ? (Date.now() - new Date(conversacion.ultimo_mensaje_entrada_fecha).getTime()) / (1000 * 60 * 60)
          : 0;

        // Determinar tipo de seguimiento basado en el contexto de Exterminador
        const tipoSeguimiento = determinarTipoSeguimiento(
          conversacion.prospectos_xt_mkt[0],
          horasTranscurridas,
          conversacion.reactivacion_intentos || 0
        );

        // Preparar payload para N8N
        const prospecto = conversacion.prospectos_xt_mkt[0];
        const webhookPayload = {
          conversation_id: conversacion.id,
          numero: conversacion.numero,
          nombre_prospecto: prospecto?.nombre || 'Cliente',
          estado_embudo: prospecto?.estado_embudo || 'lead',
          plaga_a_erradicar: prospecto?.plaga_a_erradicar || 'control de plagas',
          resumen_ia: prospecto?.resumen_ia || 'Cliente interesado en productos de exterminio',
          urgencia_detectada: prospecto?.urgencia_detectada || 'normal',
          reactivacion_intentos: conversacion.reactivacion_intentos || 0,
          horas_transcurridas: Math.round(horasTranscurridas * 100) / 100,
          tipo_seguimiento: tipoSeguimiento,
          mensajes: mensajes || [],
          total_mensajes: mensajes?.length || 0,
          timestamp: new Date().toISOString(),
          sistema: 'exterminador'
        };

        console.log(`📤 Enviando seguimiento ${tipoSeguimiento} para ${conversacion.numero}`);

        // Enviar webhook a N8N
        const webhookResponse = await fetch('https://novaisolutions.app.n8n.cloud/webhook/exterminador-seguimiento', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        const responseText = await webhookResponse.text();
        console.log(`🎯 Respuesta N8N para ${conversacion.numero}:`, webhookResponse.status);

        if (webhookResponse.ok) {
          // Marcar como procesado y actualizar contadores
          await supabase
            .from('conversaciones_xt_mkt')
            .update({
              necesita_seguimiento_4h: false,
              reactivacion_intentos: (conversacion.reactivacion_intentos || 0) + 1,
              proximo_seguimiento_4h: calcularProximoSeguimiento(
                tipoSeguimiento,
                conversacion.reactivacion_intentos || 0,
                prospecto?.urgencia_detectada || 'normal'
              ),
              updated_at: new Date().toISOString()
            })
            .eq('id', conversacion.id);

          // Actualizar prospecto
          await supabase
            .from('prospectos_xt_mkt')
            .update({
              fecha_ultimo_contacto: new Date().toISOString(),
              requiere_seguimiento: true,
              updated_at: new Date().toISOString()
            })
            .eq('conversation_id', conversacion.id);
        }

        resultados.push({
          numero: conversacion.numero,
          conversation_id: conversacion.id,
          tipo_seguimiento: tipoSeguimiento,
          webhook_enviado: webhookResponse.ok,
          webhook_status: webhookResponse.status,
          horas_transcurridas: webhookPayload.horas_transcurridas,
          plaga_detectada: prospecto?.plaga_a_erradicar
        });

        // Esperar 1 segundo entre requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error procesando ${conversacion.numero}:`, error);
        resultados.push({
          numero: conversacion.numero,
          conversation_id: conversacion.id,
          webhook_enviado: false,
          error: error.message
        });
      }
    }

    console.log('✅ Seguimiento de Exterminador completado');

    return new Response(JSON.stringify({
      success: true,
      sistema: 'exterminador_seguimiento',
      total_procesadas: resultados.length,
      webhook_url: 'https://novaisolutions.app.n8n.cloud/webhook/exterminador-seguimiento',
      resultados: resultados,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error general en seguimiento Exterminador:', error);
    return new Response(JSON.stringify({
      error: error.message,
      sistema: 'exterminador_seguimiento',
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

function determinarTipoSeguimiento(prospecto: any, horasTranscurridas: number, intentos: number): string {
  const urgencia = prospecto?.urgencia_detectada || 'normal';
  const estado = prospecto?.estado_embudo || 'lead';
  const plaga = prospecto?.plaga_a_erradicar;

  // Seguimiento urgente para casos críticos
  if (urgencia === 'alta' && horasTranscurridas >= 2) {
    return 'seguimiento_urgente';
  }

  // Seguimiento de precio para clientes interesados
  if (estado === 'interesado' && horasTranscurridas >= 4) {
    return 'seguimiento_precio';
  }

  // Seguimiento de efectividad para clientes evaluando
  if (estado === 'evaluando' && horasTranscurridas >= 6) {
    return 'seguimiento_efectividad';
  }

  // Seguimiento especializado por tipo de plaga
  if (plaga && horasTranscurridas >= 8) {
    return `seguimiento_${plaga}`;
  }

  // Reactivación para clientes inactivos
  if (intentos > 0 && horasTranscurridas >= 24) {
    return 'reactivacion_cliente';
  }

  // Seguimiento estándar
  return 'seguimiento_estandar';
}

function calcularProximoSeguimiento(tipo: string, intentos: number, urgencia: string): Date {
  const ahora = new Date();
  let horas = 24; // Por defecto 24 horas

  switch (tipo) {
    case 'seguimiento_urgente':
      horas = urgencia === 'alta' ? 2 : 4;
      break;
    case 'seguimiento_precio':
      horas = 8;
      break;
    case 'seguimiento_efectividad':
      horas = 12;
      break;
    case 'reactivacion_cliente':
      horas = 48 + (intentos * 24); // Incrementar tiempo con cada intento
      break;
    default:
      horas = 24;
  }

  // Ajustar por horarios comerciales (6 AM - 8 PM)
  const proximoSeguimiento = new Date(ahora.getTime() + horas * 60 * 60 * 1000);
  const hora = proximoSeguimiento.getHours();
  
  if (hora < 6) {
    proximoSeguimiento.setHours(6, 0, 0, 0);
  } else if (hora > 20) {
    proximoSeguimiento.setDate(proximoSeguimiento.getDate() + 1);
    proximoSeguimiento.setHours(6, 0, 0, 0);
  }

  return proximoSeguimiento;
}
