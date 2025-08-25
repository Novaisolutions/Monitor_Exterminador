import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  // Evitar que el click dentro del modal cierre el modal
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // Overlay oscuro semi-transparente
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose} // Cerrar al hacer clic en el overlay
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      {/* Contenedor del modal */}
      <div
        className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl animate-scaleIn dark:bg-gray-800"
        onClick={handleContentClick}
      >
        {/* Botón de cierre */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Título */}
        <h2 id="info-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>

        {/* Contenido */}
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
          {children}
        </div>

        {/* Botón OK/Cerrar inferior */}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            Entendido
          </button>
        </div>
      </div>
      
      {/* Añadir filtro SVG para backdrop-blur en Firefox */}
      <svg className="absolute -z-10">
          <filter id="f">
             <feGaussianBlur stdDeviation="5"></feGaussianBlur>
          </filter>
      </svg>
    </div>
  );
};

// Keyframes simples para las animaciones (pueden ir en CSS global)
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out forwards;
}
.animate-scaleIn {
  animation: scaleIn 0.2s ease-out forwards;
}
`;

// Inyectar estilos (solución simple, mejor en CSS global)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default InfoModal; 