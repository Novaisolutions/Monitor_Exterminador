# 🐛 Monitor Marketing - Exterminador

## 📋 Resumen del Proyecto

Este es el sistema de monitoreo de marketing especializado para **Exterminador**, una empresa dedicada al control de plagas. El sistema ha sido completamente adaptado desde el monitor original de CENYCA para manejar específicamente las necesidades del negocio de exterminio.

## 🎯 Características Principales

### 💬 Sistema de Mensajería WhatsApp
- **Webhook personalizado**: `exterminador-webhook` para recibir mensajes de WhatsApp
- **Análisis inteligente**: Detección automática de tipos de plagas mencionadas
- **Seguimiento 4H**: Sistema automático de seguimiento cada 4 horas
- **Análisis de sentimiento**: Evaluación del estado emocional del cliente

### 🐛 Detección Inteligente de Plagas
El sistema detecta automáticamente menciones de:
- **Cucarachas** (producto estrella - Kit Comercial $14,500)
- **Hormigas**
- **Roedores** (ratas, ratones)
- **Termitas**
- **Chinches**
- **Moscas**
- **Arácnidos**
- **Pulgas y garrapatas**

### 📊 Gestión de Prospectos
- **Estados personalizados** para el embudo de ventas de control de plagas
- **Scoring automático** basado en urgencia y tipo de plaga
- **Tags automáticas** según el tipo de plaga detectada
- **Seguimiento inteligente** con recordatorios automáticos

## 🏗️ Arquitectura Técnica

### 🗄️ Base de Datos (Supabase)
**Proyecto:** `pudrykifftcwxjlvdgmu` (NOVAI)

#### Tablas Principales:
1. **`mensajes_xt_mkt`** - Mensajes de WhatsApp
2. **`conversaciones_xt_mkt`** - Conversaciones agrupadas
3. **`prospectos_xt_mkt`** - Datos de prospectos especializados

#### Campos Específicos de Exterminador:
- `plaga_a_erradicar`: Tipo de plaga que necesita eliminar
- `producto_interes`: Producto específico de interés
- `urgencia_exterminio`: Nivel de urgencia (alta/media/baja)
- `experiencia_previa_plagas`: Experiencia previa con control de plagas

### ⚡ Edge Functions (Supabase)

#### 1. `exterminador-webhook`
- **Propósito**: Recibir y procesar mensajes de WhatsApp
- **Características**:
  - Detección automática de tipos de plagas
  - Análisis de urgencia basado en palabras clave
  - Creación automática de prospectos
  - Actualización de estadísticas de conversación

#### 2. `exterminador-seguimiento`
- **Propósito**: Sistema de seguimiento automático cada 4 horas
- **Características**:
  - Identificación de conversaciones sin respuesta
  - Envío de mensajes de seguimiento personalizados
  - Control de intentos de reactivación
  - Escalamiento por urgencia

#### 3. `exterminador-analisis`
- **Propósito**: Análisis inteligente con IA especializada en control de plagas
- **Características**:
  - Prompt especializado en el negocio de exterminio
  - Análisis de patrones de consultas por tipo de plaga
  - Recomendaciones comerciales específicas
  - Integración con Google Gemini AI

### 🔧 Triggers y Funciones de Base de Datos

#### Triggers Automáticos:
- **`update_*_updated_at`**: Actualización automática de timestamps
- **`trigger_actualizar_estadisticas_conversacion_xt`**: Estadísticas de mensajes
- **`trigger_evaluar_seguimiento_4h_xt`**: Evaluación de necesidad de seguimiento
- **`trigger_analizar_mensaje_exterminador`**: Análisis automático de mensajes

#### Funciones Especializadas:
- **`analizar_mensaje_exterminador()`**: Detección de plagas y urgencia
- **`generar_reporte_exterminador()`**: Reportes de efectividad
- **`actualizar_estadisticas_conversacion_xt()`**: Métricas de conversación

## 🎨 Frontend Personalizado

### 🧭 Navegación
- **Logo personalizado**: Cucaracha estilizada con "XT"
- **Iconografía adaptada**: Enfoque en control de plagas
- **Colores**: Esquema adaptado para la marca Exterminador

### 📋 Vista de Prospectos
- **Campos personalizados**:
  - Plaga a erradicar
  - Producto de interés
  - Urgencia del exterminio
  - Experiencia previa con plagas
- **Estados del embudo**:
  - Nuevo Lead
  - Contactado
  - Contactar más tarde
  - Cotización solicitada
  - Compra realizada
  - Cliente

### 💰 Sistema de Precios Inteligente
Precios automáticos basados en detección de productos:

#### Productos Principales:
- **Kit Comercial Cucarachas**: $14,500
- **Kit Hormigas**: $8,500
- **Kit Roedores**: $12,000
- **Kit Termitas**: $18,000
- **Kit Chinches**: $15,000

#### Servicios:
- **Fumigación**: $8,000
- **Desinfección**: $6,000
- **Control Preventivo**: $4,500
- **Seguimiento**: $2,500

## 📱 Integración con WhatsApp

### 🔗 Configuración del Webhook
```
URL: https://pudrykifftcwxjlvdgmu.supabase.co/functions/v1/exterminador-webhook
Método: POST
Verificación: Automática
```

### 🤖 Respuestas Automáticas
El sistema utiliza el siguiente prompt especializado:

```
CONTEXTO OPERATIVO
Función: Eres el canal de comunicación oficial de la marca Exterminador.
Tu objetivo es proporcionar información detallada sobre productos, resolver 
dudas de los clientes y guiar la conversación hacia la venta.

PRODUCTO ESTRELLA:
- Kit Comercial para Exterminio de Cucarachas (₡14.500)
- Componentes: Galón 3.785ml (líquido) + jeringa 60g (cebo en gel)
- Garantía: 1 mes de residualidad
- Mecanismo: Contacto, Ingesta y Necrofagia
- Seguridad: Seguro para niños y mascotas
```

## 🚀 Despliegue y Configuración

### 📋 Variables de Entorno Requeridas:
```env
VITE_SUPABASE_URL=https://pudrykifftcwxjlvdgmu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_AI_KEY=tu_clave_de_google_ai
```

### 🔧 Instalación:
```bash
# Clonar el repositorio
git clone [repositorio]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

### ☁️ Edge Functions Desplegadas:
- ✅ `exterminador-webhook` - Activa
- ✅ `exterminador-seguimiento` - Activa  
- ✅ `exterminador-analisis` - Activa

## 📊 Métricas y Análisis

### 📈 KPIs Principales:
- **Tasa de conversión** por tipo de plaga
- **Tiempo promedio de respuesta**
- **Efectividad del seguimiento 4H**
- **Productos más solicitados**
- **Urgencias detectadas automáticamente**

### 🎯 Segmentación de Clientes:
- **Por tipo de plaga**
- **Por urgencia** (normal, alta, crítica)
- **Por tipo de propiedad** (residencial, comercial)
- **Por nivel de infestación**

### 📊 Reportes Automáticos:
```sql
SELECT * FROM generar_reporte_exterminador();
```

Genera reportes con:
- Total de consultas por plaga
- Consultas urgentes
- Tasa de conversión
- Tiempo promedio de respuesta
- Productos vendidos

## 🔐 Seguridad y Permisos

### 🛡️ RLS (Row Level Security):
- Políticas configuradas para tablas `*_xt_mkt`
- Acceso controlado por usuario autenticado
- Separación completa de datos CENYCA

### 🔑 Autenticación:
- Sistema de login con Supabase Auth
- Sesiones persistentes
- Logout seguro

## 🆘 Troubleshooting

### ❌ Problemas Comunes:

#### 1. Mensajes no llegan al webhook:
- Verificar URL del webhook en WhatsApp Business API
- Revisar logs en Supabase Functions
- Confirmar que la función está activa

#### 2. Análisis de IA no funciona:
- Verificar `GOOGLE_AI_KEY` en variables de entorno
- Revisar logs de `exterminador-analisis`
- Confirmar límites de API de Google

#### 3. Seguimiento 4H no se ejecuta:
- Verificar cron job configurado
- Revisar función `exterminador-seguimiento`
- Confirmar triggers de base de datos

### 📞 Soporte:
Para soporte técnico, revisar:
1. Logs de Supabase Functions
2. Métricas de base de datos
3. Console de errores del frontend

## 🔄 Actualizaciones Futuras

### 🎯 Roadmap:
- [ ] Integración con más canales de comunicación
- [ ] Dashboard de métricas avanzadas
- [ ] Sistema de inventario de productos
- [ ] Geolocalización de servicios
- [ ] App móvil para técnicos

### 🔧 Mantenimiento:
- Actualización mensual de precios
- Revisión de prompts de IA
- Optimización de triggers
- Backup de datos críticos

---

## 📝 Notas del Desarrollador

Este sistema ha sido completamente adaptado para el negocio de **Exterminador**, eliminando todas las referencias a CENYCA y Mayo Dental. La arquitectura mantiene la robustez del sistema original pero con funcionalidades específicas para el control de plagas.

**Fecha de migración**: Enero 2025  
**Versión**: 1.0.0  
**Estado**: Producción Ready ✅

---

*Documentación generada automáticamente por el sistema de Context Engineering*
