import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { HmacSHA256 } from "https://esm.sh/jose@5";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Meta Webhook Edge Function starting...");

const metaAppSecret = Deno.env.get("META_APP_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

if (!metaAppSecret) {
  console.error("Error: META_APP_SECRET no está configurado.");
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Las variables de entorno de Supabase no están configuradas.");
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
  // Opciones específicas para Deno si son necesarias
});

serve(async (req) => {
  console.log(`Received ${req.method} request to /meta-webhook`);

  if (req.method !== 'POST') {
    console.log("Method not allowed:", req.method);
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("x-hub-signature-256")?.replace("sha256=", "");
  
  if (!metaAppSecret || !signature) {
    console.error("Falta la firma o el secreto de la app.");
    return new Response("Missing signature or secret", { status: 401 });
  }

  let rawBody = "";
  try {
    rawBody = await req.text();
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(metaAppSecret); 
    const bodyData = encoder.encode(rawBody);
    const hmac = new HmacSHA256(keyData);
    const digest = await hmac.update(bodyData).digest(); 
    const hashArray = Array.from(new Uint8Array(digest));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log("Calculated Hash:", calculatedHash);
    console.log("Received Signature:", signature);

    if (signature !== calculatedHash) {
      console.warn("Invalid signature!");
      return new Response("Invalid signature", { status: 401 });
    }
    console.log("Signature validated successfully.");

  } catch (error) {
    console.error("Error leyendo el cuerpo o validando la firma:", error);
    return new Response("Error processing request body", { status: 400 });
  }

  try {
    const payload = JSON.parse(rawBody);
    console.log("Received payload:", JSON.stringify(payload, null, 2));

    let messageDataToInsert: any = null;

    if (payload.object === 'whatsapp_business_account' && payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const messagePayload = payload.entry[0].changes[0].value.messages[0];
      const contactInfo = payload.entry[0].changes[0].value.contacts?.[0];

      if (messagePayload.type === 'text') {
        messageDataToInsert = {
          mensaje: messagePayload.text.body,
          tipo: 'entrada',
          fecha: new Date(parseInt(messagePayload.timestamp) * 1000).toISOString(),
          conversation_id: null,
          numero: messagePayload.from,
          leido: false,
        };

        console.log("Looking up conversation for number:", messageDataToInsert.numero);
        const { data: conversationData, error: convError } = await supabase
          .from('conversaciones_ce')
          .select('id')
          .eq('numero', messageDataToInsert.numero)
          .maybeSingle();

        if (convError) {
          console.error("Error fetching conversation:", convError);
        }

        if (conversationData) {
          messageDataToInsert.conversation_id = conversationData.id;
          console.log("Found existing conversation ID:", conversationData.id);
        } else {
          console.log("Conversation not found, creating new one for:", messageDataToInsert.numero);
          const { data: newConvData, error: newConvError } = await supabase
            .from('conversaciones_ce')
            .insert({ 
              numero: messageDataToInsert.numero, 
              nombre_contacto: contactInfo?.profile?.name || null,
              status: 'abierto',
              tiene_no_leidos: true,
              no_leidos_count: 1
            })
            .select('id')
            .single();

          if (newConvError) {
            console.error("Error creating conversation:", newConvError);
            return new Response("Failed to create conversation", { status: 500 });
          }
          messageDataToInsert.conversation_id = newConvData.id;
          console.log("Created new conversation ID:", newConvData.id);
        }
        
      } else {
        console.log(`Ignoring non-text message type: ${messagePayload.type}`);
        return new Response("Non-text message ignored", { status: 200 });
      }
    } else {
      console.log("Payload structure not recognized or not a message.");
      return new Response("Payload not processed", { status: 200 });
    }

    if (messageDataToInsert && messageDataToInsert.conversation_id) {
      console.log("Inserting message into Supabase with data:", messageDataToInsert);
      const { data, error: insertError } = await supabase
        .from("mensajes_ce")
        .insert(messageDataToInsert) 
        .select(); 

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return new Response(`Supabase error: ${insertError.message}`, { status: 500 });
      }

      const { error: updateConvError } = await supabase
        .from('conversaciones_ce')
        .update({ 
            updated_at: new Date().toISOString(), 
            ultimo_mensaje_resumen: messageDataToInsert.mensaje, 
            tiene_no_leidos: true,
         })
        .eq('id', messageDataToInsert.conversation_id);

      if(updateConvError) {
          console.error("Error updating conversation metadata:", updateConvError);
      }

      console.log("Message inserted successfully:", data);
      return new Response("Webhook processed successfully", { status: 200 });
    } else {
       console.log("No message data generated to insert.");
       return new Response("No relevant message data found in payload", { status: 200 });
    }

  } catch (error) {
    console.error("Error parsing JSON or processing payload logic:", error);
    return new Response("Error processing payload", { status: 400 });
  }
}); 