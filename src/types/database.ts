// Tipo para datos JSON genéricos
type Json = Record<string, any> | any[] | string | number | boolean | null;

export interface Conversacion {
  id: number;
  numero: string;
  resumen: string | null;
  status: string;
  updated_at: string;
  reactivacion_intentos: number;
  ultimo_intento_reactivacion: string | null;
  proximo_seguimiento: string | null;
  nombre_contacto: string | null;
  ultimo_mensaje_resumen: string | null;
  tiene_no_leidos: boolean;
  no_leidos_count: number;
  plantel: string | null;
  resumen_ia?: string | null;
  real_last_message_date?: string; // Campo auxiliar para ordenamiento por último mensaje real
}

export interface Mensaje {
  id: number;
  tipo: string;
  numero: string;
  mensaje: string;
  fecha: string;
  nombre: string | null;
  media_url: string | null;
  leido: boolean;
  conversation_id: number | null;
}

export interface ProspectoMkt {
  id: number;
  created_at: string;
  updated_at: string;
  nombre: string | null;
  carrera_interes: string | null;
  plantel_interes: string | null;
  turno: string | null;
  numero_telefono: string | null;
  estado_embudo: string | null;
  prioridad: string | null;
  resumen_ia: string | null;
  ultima_intencion: string | null;
  sentimiento_conversacion: string | null;
  score_interes: number | null;
  probabilidad_conversion: number | null;
  fecha_ultimo_contacto: string | null;
  proximo_seguimiento: string | null;
  notas_ia: string | null;
  tags_automaticas: string[] | null;
  historial_estados: Json | null;
  metricas_conversacion: Json | null;
  alertas_ia: string[] | null;
  presupuesto_mencionado: number | null;
  objeciones_detectadas: string[] | null;
  momento_optimo_contacto: string | null;
  perfil_comunicacion: string | null;
  urgencia_detectada: string | null;
  competencia_mencionada: string[] | null;
  fecha_decision_estimada: string | null;
  canal_preferido: string | null;
  horario_preferido: string | null;
  motivaciones_principales: string[] | null;
  barreras_identificadas: string[] | null;
  conversation_id: number | null;
  notas_manuales: { content: string; timestamp: string; author?: string }[] | null;
  real_last_message_date?: string; // Campo auxiliar para ordenamiento por último mensaje real
}