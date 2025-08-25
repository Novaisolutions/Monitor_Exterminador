import React from 'react';
import { Conversacion, Mensaje } from '../../types/database'; // Ajustar ruta
import { truncateText } from '../../utils/textUtils'; // Ajustar ruta
import { formatInTimeZone } from 'date-fns-tz'; // Importar función
import useSettings from '../../hooks/useSettings';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConversationItemProps {
  conversation?: Conversacion | null;
  messagePreview?: Mensaje;
  isSelected: boolean;
  onClick: () => void;
  getConversationFromMessage: (msg: Mensaje) => Conversacion | null;
  isNewlyUpdated?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  messagePreview,
  isSelected,
  onClick,
  getConversationFromMessage,
  isNewlyUpdated = false
}) => {
  // Obtener la zona horaria desde settings
  const { timeZone } = useSettings();
  
  const displayConversation = conversation ?? (messagePreview ? getConversationFromMessage(messagePreview) : null);

  const name = displayConversation?.nombre_contacto || 'Sin nombre';
  const number = displayConversation?.numero || messagePreview?.numero || '';
  const previewText = messagePreview
    ? truncateText(messagePreview.mensaje, 40)
    : displayConversation?.ultimo_mensaje_resumen || 'Sin mensajes';
  
  // Determinar la fecha relevante para formatear la hora
  // Prioridad: 1) fecha del messagePreview, 2) real_last_message_date, 3) updated_at
  const relevantDate = messagePreview?.fecha || 
                      (displayConversation as any)?.real_last_message_date || 
                      displayConversation?.updated_at;
  
  // Formatear la hora usando la zona horaria desde settings
  const time = relevantDate
    ? formatInTimeZone(new Date(relevantDate), timeZone, 'HH:mm')
    : '--:--';

  const unreadCount = displayConversation?.tiene_no_leidos ? displayConversation.no_leidos_count : 0;
  const avatarInitial = name?.[0]?.toUpperCase() || '#';

  let timeAgo = '';
  // Usar la misma fecha relevante para el tiempo relativo
  const dateToFormat = messagePreview?.fecha || 
                      (displayConversation as any)?.real_last_message_date || 
                      displayConversation?.updated_at;
  if (dateToFormat) {
    try {
      timeAgo = formatDistanceToNow(parseISO(dateToFormat), { addSuffix: true, locale: es });
      timeAgo = timeAgo.replace('hace alrededor de', 'hace');
      timeAgo = timeAgo.replace('hace menos de un minuto', 'ahora');
      timeAgo = timeAgo.replace('hace aproximadamente', 'hace');
      timeAgo = timeAgo.replace('hace casi', 'hace');
    } catch (e) {
      console.error("Error formatting date:", dateToFormat, e);
      timeAgo = 'Fecha inválida';
    }
  }

  const itemClasses = [
    'conversation-item',
    isSelected ? 'active' : '',
    isNewlyUpdated ? 'animate-highlight' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={itemClasses}
      onClick={onClick}
    >
      <div className="avatar">
        {/* Aquí podríamos añadir lógica para mostrar imagen si existe */}
        {/* <img src={displayConversation?.avatarUrl || defaultAvatar} alt={avatarInitial} /> */}
        {avatarInitial}
      </div>
      <div className="conversation-details">
        <div className="conversation-name-container">
          <div className="conversation-name">
            {name}
          </div>
          <div className="conversation-time">
            {timeAgo && <span>{timeAgo}</span>}
          </div>
        </div>
        <div className="conversation-preview-container">
          <div className="conversation-number">
            {number}
          </div>
          <div className="conversation-preview">
            {previewText}
          </div>
          {unreadCount > 0 && (
            <div className="unread-badge">{unreadCount}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem; 