import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("🚀 Exterminador Webhook iniciado");

Deno.serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("📥 Webhook recibido:", JSON.stringify(body, null, 2));

    // Verificar si es un webhook de WhatsApp
    if (!body.entry || !Array.isArray(body.entry)) {
      return new Response('Invalid webhook format', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    for (const entry of body.entry) {
      if (!entry.changes) continue;

      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;
        
        const value = change.value;
        if (!value.messages && !value.statuses) continue;

        // Procesar mensajes entrantes
        if (value.messages) {
          for (const message of value.messages) {
            await processIncomingMessage(supabase, message, value.metadata);
          }
        }

        // Procesar estados de mensajes
        if (value.statuses) {
          for (const status of value.statuses) {
            await processMessageStatus(supabase, status);
          }
        }
      }
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processIncomingMessage(supabase: any, message: any, metadata: any) {
  try {
    const phoneNumber = message.from;
    const messageText = message.text?.body || message.interactive?.button_reply?.title || '[Mensaje multimedia]';
    const messageType = message.type;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);

    console.log(`📱 Procesando mensaje de ${phoneNumber}: ${messageText}`);

    // Buscar o crear conversación
    let { data: conversation, error: convError } = await supabase
      .from('conversaciones_xt_mkt')
      .select('id')
      .eq('numero', phoneNumber)
      .single();

    if (convError && convError.code === 'PGRST116') {
      // Crear nueva conversación
      const { data: newConv, error: createError } = await supabase
        .from('conversaciones_xt_mkt')
        .insert([{
          numero: phoneNumber,
          status: 'activa',
          nombre_contacto: metadata?.display_phone_number || phoneNumber,
          ultimo_mensaje_fecha: timestamp,
          ultimo_mensaje_tipo: 'entrada',
          total_mensajes_entrada: 1,
          total_mensajes: 1,
          necesita_seguimiento_4h: true,
          proximo_seguimiento_4h: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 horas
        }])
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Error creando conversación:', createError);
        return;
      }
      conversation = newConv;
    } else if (convError) {
      console.error('❌ Error buscando conversación:', convError);
      return;
    }

    // Insertar mensaje
    const { error: messageError } = await supabase
      .from('mensajes_xt_mkt')
      .insert([{
        tipo: 'entrada',
        numero: phoneNumber,
        mensaje: messageText,
        fecha: timestamp,
        conversation_id: conversation.id,
        leido: false
      }]);

    if (messageError) {
      console.error('❌ Error guardando mensaje:', messageError);
      return;
    }

    // Actualizar conversación
    await supabase
      .from('conversaciones_xt_mkt')
      .update({
        ultimo_mensaje_fecha: timestamp,
        ultimo_mensaje_tipo: 'entrada',
        ultimo_mensaje_entrada_fecha: timestamp,
        total_mensajes_entrada: supabase.raw('total_mensajes_entrada + 1'),
        total_mensajes: supabase.raw('total_mensajes + 1'),
        tiene_no_leidos: true,
        no_leidos_count: supabase.raw('no_leidos_count + 1'),
        necesita_seguimiento_4h: true,
        proximo_seguimiento_4h: new Date(Date.now() + 4 * 60 * 60 * 1000),
        updated_at: new Date()
      })
      .eq('id', conversation.id);

    // Buscar o crear prospecto
    let { data: prospecto, error: prospectError } = await supabase
      .from('prospectos_xt_mkt')
      .select('id')
      .eq('numero_telefono', phoneNumber)
      .single();

    if (prospectError && prospectError.code === 'PGRST116') {
      // Crear nuevo prospecto con datos específicos de Exterminador
      const estadoInicial = determinarEstadoInicial(messageText);
      const plagaDetectada = detectarTipoPlaga(messageText);
      
      const { error: createProspectError } = await supabase
        .from('prospectos_xt_mkt')
        .insert([{
          numero_telefono: phoneNumber,
          conversation_id: conversation.id,
          estado_embudo: estadoInicial,
          plaga_a_erradicar: plagaDetectada,
          resumen_ia: `Cliente consulta sobre ${plagaDetectada || 'control de plagas'}`,
          ultima_intencion: 'consulta_inicial',
          sentimiento_conversacion: 'neutral',
          score_complejidad: calcularComplejidadInicial(messageText),
          fecha_ultimo_contacto: timestamp,
          ultimo_mensaje_fecha: timestamp,
          tags_automaticas: generarTagsIniciales(messageText, plagaDetectada),
          urgencia_detectada: detectarUrgencia(messageText),
          is_initialized: false
        }]);

      if (createProspectError) {
        console.error('❌ Error creando prospecto:', createProspectError);
      }
    } else {
      // Actualizar prospecto existente
      const plagaDetectada = detectarTipoPlaga(messageText);
      const tagsActuales = await obtenerTagsActuales(supabase, prospecto.id);
      const nuevasTags = generarTagsIniciales(messageText, plagaDetectada);
      const tagsUnificadas = [...new Set([...tagsActuales, ...nuevasTags])];

      await supabase
        .from('prospectos_xt_mkt')
        .update({
          fecha_ultimo_contacto: timestamp,
          ultimo_mensaje_fecha: timestamp,
          score_complejidad: supabase.raw('LEAST(score_complejidad + 5, 100)'),
          tags_automaticas: tagsUnificadas,
          urgencia_detectada: detectarUrgencia(messageText),
          updated_at: new Date()
        })
        .eq('id', prospecto.id);
    }

    // Enviar a N8N para procesamiento con IA
    await enviarAProcessingIA(phoneNumber, messageText, conversation.id);

    console.log(`✅ Mensaje procesado exitosamente para ${phoneNumber}`);

  } catch (error) {
    console.error('❌ Error procesando mensaje entrante:', error);
  }
}

async function processMessageStatus(supabase: any, status: any) {
  try {
    console.log(`📊 Procesando estado de mensaje: ${status.status}`);
    
    // Actualizar estado del mensaje si es necesario
    if (status.status === 'delivered' || status.status === 'read') {
      await supabase
        .from('mensajes_xt_mkt')
        .update({ leido: status.status === 'read' })
        .eq('numero', status.recipient_id);
    }
  } catch (error) {
    console.error('❌ Error procesando estado:', error);
  }
}

function determinarEstadoInicial(mensaje: string): string {
  const mensajeLower = mensaje.toLowerCase();
  
  if (mensajeLower.includes('precio') || mensajeLower.includes('costo') || mensajeLower.includes('cuanto')) {
    return 'interesado';
  }
  if (mensajeLower.includes('urgente') || mensajeLower.includes('rapido') || mensajeLower.includes('ya')) {
    return 'evaluando';
  }
  return 'lead';
}

function detectarTipoPlaga(mensaje: string): string | null {
  const mensajeLower = mensaje.toLowerCase();
  
  if (mensajeLower.includes('cucaracha')) return 'cucarachas';
  if (mensajeLower.includes('hormiga')) return 'hormigas';
  if (mensajeLower.includes('rata') || mensajeLower.includes('raton')) return 'roedores';
  if (mensajeLower.includes('termita')) return 'termitas';
  if (mensajeLower.includes('chinche')) return 'chinches';
  if (mensajeLower.includes('mosca')) return 'moscas';
  if (mensajeLower.includes('avispa') || mensajeLower.includes('abeja')) return 'himenópteros';
  if (mensajeLower.includes('araña')) return 'arácnidos';
  if (mensajeLower.includes('pulga')) return 'pulgas';
  if (mensajeLower.includes('garrapata')) return 'garrapatas';
  
  return null;
}

function calcularComplejidadInicial(mensaje: string): number {
  let complejidad = 30; // Base
  
  if (mensaje.length > 100) complejidad += 10;
  if (mensaje.includes('?')) complejidad += 5;
  if (mensaje.toLowerCase().includes('urgente')) complejidad += 15;
  if (detectarTipoPlaga(mensaje)) complejidad += 10;
  
  return Math.min(complejidad, 100);
}

function generarTagsIniciales(mensaje: string, plaga: string | null): string[] {
  const tags: string[] = [];
  const mensajeLower = mensaje.toLowerCase();
  
  if (plaga) tags.push(plaga);
  if (mensajeLower.includes('precio') || mensajeLower.includes('costo')) tags.push('precio');
  if (mensajeLower.includes('urgente')) tags.push('urgente');
  if (mensajeLower.includes('casa') || mensajeLower.includes('hogar')) tags.push('residencial');
  if (mensajeLower.includes('negocio') || mensajeLower.includes('empresa')) tags.push('comercial');
  if (mensajeLower.includes('producto')) tags.push('consulta_producto');
  if (mensajeLower.includes('efectivo') || mensajeLower.includes('funciona')) tags.push('efectividad');
  
  return tags;
}

function detectarUrgencia(mensaje: string): string {
  const mensajeLower = mensaje.toLowerCase();
  
  if (mensajeLower.includes('urgente') || mensajeLower.includes('ya') || mensajeLower.includes('rapido')) {
    return 'alta';
  }
  if (mensajeLower.includes('cuando') || mensajeLower.includes('pronto')) {
    return 'media';
  }
  return 'normal';
}

async function obtenerTagsActuales(supabase: any, prospectoId: number): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('prospectos_xt_mkt')
      .select('tags_automaticas')
      .eq('id', prospectoId)
      .single();
    
    if (error || !data) return [];
    return data.tags_automaticas || [];
  } catch (error) {
    console.error('❌ Error obteniendo tags:', error);
    return [];
  }
}

async function enviarAProcessingIA(phoneNumber: string, mensaje: string, conversationId: number) {
  try {
    const webhookUrl = 'https://novaisolutions.app.n8n.cloud/webhook/exterminador-ia';
    
    const payload = {
      numero: phoneNumber,
      mensaje: mensaje,
      conversation_id: conversationId,
      timestamp: new Date().toISOString(),
      tipo: 'mensaje_entrante'
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`⚠️ N8N webhook respondió con status ${response.status}`);
    } else {
      console.log('✅ Enviado a N8N para procesamiento IA');
    }
  } catch (error) {
    console.warn('⚠️ Error enviando a N8N (continuando):', error.message);
  }
}
