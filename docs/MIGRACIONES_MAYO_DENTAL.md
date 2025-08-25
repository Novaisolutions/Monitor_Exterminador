# Migraciones Mayo Dental

Este documento resume los cambios aplicados en `nhxwyrkhsjybndwksmwi`.

## Tablas
- `conversaciones_mkt`: conversaciones WhatsApp/Meta por número.
- `mensajes_mkt`: mensajes asociados a `conversacion_id`.
- `prospectos_mkt`: entidad CRM del prospecto; extendida con campos del dominio dental.

## RPC y Triggers
- `get_conversations_with_last_message_date(limit, offset)`
- `get_prospectos_with_last_message_date()`
- Triggers:
  - Asegurar conversación al insertar mensaje
  - Actualizar agregados de conversación al nuevo mensaje
  - Crear/actualizar prospecto automáticamente al primer mensaje

## RLS
Políticas abiertas para `authenticated` temporalmente. Endurecer por rol/tenant si aplica.

## Notas
- `prospectos_mayo` NO se usa; se homologó a `prospectos_mkt` con campos específicos.
- Falta indexación GIN/BTREE según carga real.
