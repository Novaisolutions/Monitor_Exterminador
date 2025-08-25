import React from 'react';
import { Conversacion } from '../../types/database';
import AnalysisSidebar from '../analysis/AnalysisSidebar'; // Componente a crear

interface AnalysisViewProps {
  conversations: Conversacion[];
  fetchConversations: () => void; // Para poder refrescar tras análisis
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ conversations, fetchConversations }) => {
  return (
    <div className="analysis-view" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Por ahora, solo renderiza la barra lateral de análisis */}
      {/* Podría tener su propio header o layout si fuera necesario */}
      <AnalysisSidebar 
        conversations={conversations} 
        fetchConversations={fetchConversations} 
      />
    </div>
  );
};

export default AnalysisView; 