// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.52.7/mod.ts"; // Importar librería OpenAI

console.log("Minimal Summarize Conversation function started.");

// Obtener secretos y URLs de forma segura
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");
const openAIKey = Deno.env.get("OPENAI_API_KEY");

// Verificar que todas las variables de entorno necesarias estén presentes
if (!supabaseUrl || !supabaseServiceKey || !openAIKey) {
  const missingVars = [
    !supabaseUrl ? 'SUPABASE_URL' : null,
    !supabaseServiceKey ? 'SUPABASE_SERVICE_KEY' : null,
    !openAIKey ? 'OPENAI_API_KEY' : null,
  ].filter(Boolean).join(', ');
  console.error(`Error Fatal: Faltan variables de entorno críticas: ${missingVars}`);
  // Devolver un error 500 claro si faltan variables
  return new Response(JSON.stringify({ error: `Configuración incompleta del servidor: faltan ${missingVars}` }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

// Inicializar clientes (ahora sabemos que las claves existen)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 
const openai = new OpenAI({ apiKey: openAIKey });

serve(async (req) => {
  console.log(`Minimal function received request: ${req.method} ${req.url}`);

  // Es crucial responder a OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*', // Permitir todos los orígenes (AJUSTAR EN PRODUCCIÓN)
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Cabeceras que supabase-js envía
      },
    });
  }

  // Responder a POST (lo que usa invoke)
  if (req.method === 'POST') {
     let requestBody = {};
     try {
       // Intentar leer el body para depurar
       requestBody = await req.json();
       console.log("Minimal function received body:", requestBody);
     } catch (e) {
       console.warn("Minimal function: Could not parse request body, but proceeding.");
     }

    return new Response(JSON.stringify({ message: "Minimal function reached successfully!" }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Permitir todos los orígenes (AJUSTAR EN PRODUCCIÓN)
        'Content-Type': 'application/json',
      },
    });
  }

  // Devolver error para otros métodos
  console.log(`Minimal function: Method Not Allowed (${req.method})`);
  return new Response("Method Not Allowed", { status: 405 });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/summarize-conversation' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
