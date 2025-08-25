# Integración CRM Kommo - Mayo Dental Monitor

## Descripción General

Se ha integrado exitosamente el CRM Kommo en el monitor de Mayo Dental, proporcionando una vista completa del embudo de ventas y la gestión de leads directamente desde la aplicación principal.

## Características Implementadas

### 1. Nueva Pestaña CRM Kommo
- **Ubicación**: Barra lateral de navegación
- **Ícono**: Building2 (edificio corporativo)
- **Ruta**: `/kommo`
- **Descripción**: "CRM Kommo - Embudo de Ventas"

### 2. Componente KommoView
- **Archivo**: `src/components/layout/KommoView.tsx`
- **Funcionalidades**:
  - Visualización de estadísticas generales de leads
  - Embudo de ventas interactivo por pipeline
  - Lista detallada de leads por estado
  - Modal con detalles completos de cada lead
  - Botón de actualización de datos en tiempo real

### 3. Hook useKommo
- **Archivo**: `src/hooks/useKommo.ts`
- **Responsabilidades**:
  - Conexión con la API de Kommo
  - Gestión de estados de carga y error
  - Cálculo automático de estadísticas
  - Funciones utilitarias para filtrado de datos

### 4. Estadísticas Mostradas
- **Total de Leads**: Número total de leads en el CRM
- **Valor Total**: Suma de todos los valores de los leads
- **Valor Promedio**: Valor promedio por lead
- **Tasa de Conversión**: Porcentaje de leads cerrados exitosamente

## Configuración Técnica

### Variables de Entorno
```env
# Kommo CRM Configuration
VITE_KOMMO_BASE_URL=https://bizmakermx.kommo.com/api/v4
VITE_KOMMO_ACCESS_TOKEN=<token_de_acceso>
VITE_KOMMO_CLIENT_ID=a769e827-d983-43fe-8b9b-8c1e7a4d849f
VITE_KOMMO_CLIENT_SECRET=<client_secret>
```

### Endpoints de API Utilizados
1. **GET /leads/pipelines** - Obtener embudos y estados
2. **GET /leads?limit=250** - Obtener leads (máximo 250)

### Estructura de Datos

#### KommoLead
```typescript
interface KommoLead {
  id: number;
  name: string;
  price: number;
  status_id: number;
  pipeline_id: number;
  created_at: number;
  updated_at: number;
  closed_at?: number;
  // ... más campos
}
```

#### KommoPipeline
```typescript
interface KommoPipeline {
  id: number;
  name: string;
  _embedded: {
    statuses: KommoStatus[];
  };
}
```

#### KommoStatus
```typescript
interface KommoStatus {
  id: number;
  name: string;
  color: string;
  pipeline_id: number;
  // ... más campos
}
```

## Funcionalidades del Usuario

### 1. Vista Principal
- **Tarjetas de estadísticas**: Resumen visual de métricas clave
- **Botón de actualización**: Refresca los datos desde Kommo
- **Diseño responsive**: Adaptado para móvil y escritorio

### 2. Embudo de Ventas
- **Visualización por pipeline**: Cada embudo se muestra por separado
- **Estados clickeables**: Al hacer clic en un estado se muestran los leads
- **Barras de progreso**: Representación visual del porcentaje de leads
- **Códigos de color**: Cada estado mantiene su color original de Kommo

### 3. Lista de Leads
- **Filtrado por estado**: Solo se muestran leads del estado seleccionado
- **Información básica**: ID, nombre, valor, fecha de creación
- **Ordenamiento**: Por defecto ordenados por fecha de creación

### 4. Detalles del Lead
- **Modal interactivo**: Ventana emergente con información completa
- **Datos principales**: Nombre, valor, estado, fechas relevantes
- **Enlace directo**: Botón para abrir el lead en Kommo
- **Diseño responsive**: Adaptado para todos los tamaños de pantalla

## Estilos y Diseño

### Tema Consistente
- Utiliza las variables CSS del tema principal
- Soporte completo para modo claro y oscuro
- Transiciones suaves entre estados

### Responsive Design
- **Móvil**: Grid de 2 columnas para estadísticas
- **Escritorio**: Grid de 4 columnas
- **Modal**: Ajuste automático al tamaño de pantalla

## Gestión de Errores

### Estados de Error Manejados
1. **Error de conexión**: Problema de red o API no disponible
2. **Token expirado**: Credenciales de acceso inválidas
3. **Datos corruptos**: Respuesta malformada de la API
4. **Rate limiting**: Demasiadas peticiones por minuto

### Recuperación Automática
- Botón de reintento en caso de error
- Fallback a token hardcodeado si variables de entorno fallan
- Mensajes de error descriptivos para el usuario

## Integración con n8n

El flujo de n8n proporcionado maneja la autenticación OAuth2 con Kommo:

### Webhook de Callback
- **URL**: `https://novaisolutions.app.n8n.cloud/webhook/kommo_bizmaker/callback`
- **Función**: Recibe el código de autorización de Kommo
- **Procesamiento**: Intercambia el código por un token de acceso

### Configuración OAuth2
- **Client ID**: `a769e827-d983-43fe-8b9b-8c1e7a4d849f`
- **Redirect URI**: URL del webhook de n8n
- **Scopes**: `push_notifications`, `files`, `crm`, `files_delete`, `notifications`

## Próximas Mejoras

### Funcionalidades Pendientes
1. **Sincronización bidireccional**: Crear/editar leads desde el monitor
2. **Notificaciones en tiempo real**: WebSockets para actualizaciones automáticas
3. **Filtros avanzados**: Por fecha, valor, responsable, etc.
4. **Exportación de datos**: CSV, PDF para reportes
5. **Integración con prospectos**: Vincular leads de Kommo con prospectos del monitor

### Optimizaciones Técnicas
1. **Cache de datos**: Reducir llamadas a la API
2. **Paginación**: Manejar grandes volúmenes de leads
3. **Búsqueda**: Filtro de texto en tiempo real
4. **Refresh automático**: Actualización periódica de datos

## Uso Recomendado

1. **Monitoreo diario**: Revisar estadísticas generales cada mañana
2. **Seguimiento de pipeline**: Identificar cuellos de botella en el embudo
3. **Gestión de leads**: Priorizar seguimiento según estado y valor
4. **Análisis de conversión**: Evaluar efectividad del proceso de ventas

## Soporte y Mantenimiento

### Logs y Debugging
- Todos los errores se registran en la consola del navegador
- Estados de carga visibles para el usuario
- Información detallada en caso de fallas de API

### Actualización de Tokens
- Los tokens de Kommo tienen una vigencia limitada
- Se recomienda implementar refresh automático
- Monitorear logs para detectar tokens expirados

---

**Fecha de implementación**: Enero 2025  
**Versión**: 1.0  
**Desarrollado por**: Novai Solutions para Mayo Dental
