import React from 'react';
import { Mensaje } from '../../types/database'; // Ajustar ruta
import { formatInTimeZone } from 'date-fns-tz'; // Importar función
import useSettings from '../../hooks/useSettings';
import { Check, CheckCheck } from 'lucide-react'; // Importar iconos para estado de leído
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

interface MessageBubbleProps {
  message: Mensaje;
  renderMessageContent: (mensaje: Mensaje) => React.ReactNode; // Función para renderizar contenido (texto + imágenes)
  isNew?: boolean; // Flag para indicar si es un mensaje recién recibido
  animationDelayMs?: number; // Retraso para animación escalonada
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, renderMessageContent, isNew = false, animationDelayMs }) => {
  // Obtener la zona horaria desde settings
  const { timeZone } = useSettings();
  const isOutbound = message.tipo === 'salida';
  const alignmentClass = isOutbound ? 'message-outbound' : 'message-inbound';
  
  // Añadir clase de animación si es nuevo
  const animationClass = isNew ? 'message-new-smooth' : '';

  // Formatear la hora
  const formatMessageTime = (utcDate: Date): string => {
    try {
      const zonedDate = toZonedTime(utcDate, timeZone);
      return format(zonedDate, 'HH:mm', { locale: es });
    } catch (error) {
      console.error("Error formatting date:", error, "Date:", utcDate, "TimeZone:", timeZone);
      return "--:--";
    }
  };

  const staggerStyle = animationDelayMs != null ? {
    opacity: 0,
    transform: 'translateY(8px)'
  } as React.CSSProperties : undefined;

  return (
    <div
      id={`message-${message.id}`} // Añadir ID para posible scroll/highlight
      className={`message-bubble ${alignmentClass} ${animationClass} ${animationDelayMs != null ? 'staggered' : ''}`}
      style={animationDelayMs != null ? { ...(staggerStyle || {}), animationDelay: `${animationDelayMs}ms`, animationFillMode: 'forwards' } : undefined}
    >
      <div className="message-content">
        {renderMessageContent(message)}
      </div>
      <div className="message-footer">
        <div className="message-time">
          {formatMessageTime(new Date(message.fecha))}
        </div>
        {/* Mostrar indicador de leído/no leído solo para mensajes salientes */}
        {message.tipo === 'salida' && (
          <div className={`message-status ${message.leido ? 'read' : 'unread'}`}>
            {message.leido ? <CheckCheck size={16} /> : <Check size={16} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble; 