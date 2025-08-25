import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normaliza valores del estado del embudo a un conjunto estable usado en UI
export function normalizeEstadoEmbudo(value?: string | null): string {
  if (!value) return 'lead';
  const raw = String(value).trim();
  const v = raw
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (v === 'lead' || v === 'nuevo lead') return 'lead';
  if (v === 'contactado') return 'contactado';
  if (v === 'llamar mas tarde' || v === 'llamar más tarde') return 'llamar_mas_tarde';
  if (v === 'cita solicitada') return 'cita solicitada';
  if (v === 'cita solicitada.' || v === 'cita_solicitada') return 'cita solicitada';
  if (v.includes('agend') && v.includes('cita')) return 'agendó cita.';
  if (v === 'inscrito' || v === 'inscrita') return 'inscrito';

  // Valor por defecto: regresar crudo para no perder información
  return raw;
}

// Función para formatear números de teléfono
export function formatPhoneNumber(phone: string): string {
  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatear como +52 XXX XXX XXXX
  if (cleaned.length === 10) {
    return `+52 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // Si ya incluye código de país
  if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  return phone; // Retornar original si no coincide con formatos esperados
}

// Función para truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Función para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para generar colores de avatar basados en texto
export function getAvatarColor(text: string): string {
  const colors = [
    '#3e95d9', '#4fd2e8', '#6a8ccc', '#5b9bd5',
    '#70ad47', '#ffc000', '#ff7c00', '#e74c3c',
    '#9b59b6', '#1abc9c', '#f39c12', '#e67e22'
  ];
  
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Función para debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Función para formatear fecha relativa
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return 'Ahora';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return targetDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }
}

// Función para extraer iniciales de un nombre
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
