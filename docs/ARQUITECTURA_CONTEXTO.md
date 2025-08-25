## Arquitectura Monitor Mayo Dental

- Frontend: Vite + React + @supabase/supabase-js
- Tablas principales: public.conversaciones_mkt, public.mensajes_mkt, public.prospectos_mkt
- Edge Functions (referencia CENYCA, a adaptar): seguimiento-4h, chatbot-sql-generator, chatbot-analysis
- Integración n8n: actualiza public.conversaciones_mkt

### Prompt del agente Ziara (resumen)
- Responde JSON estricto
- Actualiza estado en conversaciones_mkt
- Captura: motivo_consulta, tratamiento_interes, presupuesto_aproximado, etc.

### Próximos pasos
1) Crear vistas o tablas específicas de Mayo (prefijo mayo_) reflejando campos del prompt
2) Ajustar hooks useProspectos/useConversations para nuevos campos
3) Desplegar edge functions equivalentes en proyecto Mayo
