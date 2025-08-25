import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("🔬 Exterminador Análisis iniciado");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      user_query,
      conversation_history,
      data_context,
      analysis_info,
      records_found
    } = await req.json();

    console.log('🔍 Solicitud de análisis Exterminador:', {
      query: user_query,
      analysis_type: analysis_info?.type,
      records_found
    });

    // Configurar Google AI con Gemini
    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY not configured');
    }

    // Prompt especializado para Exterminador
    const systemPrompt = `Eres un analista de datos experto especializado en el negocio de control de plagas y productos de exterminio. Tu trabajo es analizar conversaciones de WhatsApp y proporcionar insights específicos para la marca Exterminador.

CONTEXTO DEL NEGOCIO EXTERMINADOR:
- Empresa especializada en productos de exterminio y control de plagas
- Producto estrella: Kit Comercial para Exterminio de Cucarachas (₡14.500)
- Componentes: Galón 3.785ml (líquido) + jeringa 60g (cebo en gel)
- Garantía: 1 mes de residualidad
- Mecanismo: Contacto, Ingesta y Necrofagia
- Seguridad: Seguro para niños y mascotas
- Tipos de mensajes: "entrada" (del cliente) y "salida" (de Exterminador)

TIPOS DE PLAGAS PRINCIPALES:
- Cucarachas (producto principal)
- Hormigas
- Roedores (ratas, ratones)
- Termitas
- Chinches
- Moscas
- Arácnidos
- Pulgas y garrapatas

ANÁLISIS ESPECIALIZADO PARA EXTERMINADOR:
1. ANÁLISIS DE CONVERSIÓN:
   - Consultas por tipo de plaga
   - Tiempo desde consulta hasta compra
   - Objeciones más comunes (precio, efectividad, seguridad)
   - Tasa de conversión por urgencia detectada

2. PATRONES DE COMPORTAMIENTO:
   - Horarios de mayor consulta por emergencias
   - Estacionalidad de plagas
   - Consultas residenciales vs comerciales
   - Seguimientos efectivos por tipo de plaga

3. ANÁLISIS DE PRODUCTOS:
   - Consultas sobre efectividad
   - Preguntas sobre seguridad (niños/mascotas)
   - Comparaciones con competencia
   - Solicitudes de garantía

4. SEGMENTACIÓN DE CLIENTES:
   - Por tipo de plaga
   - Por urgencia (normal, alta, crítica)
   - Por tipo de propiedad (casa, negocio)
   - Por nivel de infestación

EJEMPLOS DE INSIGHTS VALIOSOS:
- "Las consultas sobre cucarachas aumentan 40% los lunes por avistamientos del fin de semana"
- "Clientes que mencionan 'urgente' tienen 65% más probabilidad de comprar"
- "Preguntas sobre seguridad para mascotas indican mayor intención de compra"
- "Seguimientos a las 4 horas aumentan conversión en 30%"

TU PERSONALIDAD:
- Experto en control de plagas y marketing
- Analítico pero accesible
- Proporciona insights específicos y accionables
- Usa datos concretos del negocio
- Sugiere acciones comerciales específicas

INSTRUCCIONES:
1. Analiza los datos desde la perspectiva del control de plagas
2. Identifica patrones específicos del negocio Exterminador
3. Proporciona recomendaciones comerciales concretas
4. Mantén respuestas concisas pero informativas (max 400 palabras)
5. Incluye métricas específicas cuando sea posible

HISTORIAL DE CONVERSACIÓN:
${conversation_history || 'Inicio de análisis'}

DATOS DE EXTERMINADOR (${records_found} registros):
${data_context}

TIPO DE ANÁLISIS:
${analysis_info?.intent || 'Análisis general de control de plagas'}`;

    const userPrompt = `CONSULTA: ${user_query}

Analiza los datos desde la perspectiva del negocio Exterminador. Proporciona insights específicos sobre:
- Patrones de consultas por tipo de plaga
- Oportunidades de conversión
- Recomendaciones para mejorar ventas
- Tendencias en el comportamiento de clientes

Si los datos son limitados, menciona esta limitación pero proporciona el análisis disponible con recomendaciones específicas para Exterminador.`;

    // Llamar a Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Gemini API:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Análisis Gemini completado');

    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('No content received from Gemini');
    }

    // Agregar metadatos específicos de Exterminador
    const finalContent = content + `\n\n🐛 **Análisis Exterminador basado en ${records_found} ${records_found === 1 ? 'registro' : 'registros'} de conversaciones sobre control de plagas**\n\n💡 *Recomendación: Utiliza estos insights para optimizar el seguimiento de clientes y mejorar las tasas de conversión del Kit Exterminador.*`;

    return new Response(
      JSON.stringify({
        content: finalContent,
        analysis_type: 'exterminador_' + (analysis_info?.type || 'general'),
        records_analyzed: records_found,
        business_context: 'control_de_plagas',
        product_focus: 'kit_exterminador_cucarachas',
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error en análisis Exterminador:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        content: `Lo siento, he encontrado un problema técnico al analizar tu consulta sobre control de plagas. Error: ${error.message}`,
        business_context: 'exterminador',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
