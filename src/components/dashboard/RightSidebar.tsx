import React, { useState } from 'react';
import {
  Activity,
  LineChart,
  Zap,
  ChevronLeft,
  MessageSquare,
  CheckCircle2,
  Clock4,
  Star,
  Grid3X3,
  Settings
} from 'lucide-react';

// Asumiendo que estos tipos se importan o definen en otro lugar
interface DashboardStats {
  totalMessages: number;
  respondedMessages: number;
  averageResponseTime: string;
  activeChats: number;
  staleConversations: number;
}

interface KeywordData {
  word: string;
  count: number;
}

interface RightSidebarProps {
  stats: DashboardStats;
  keywords: KeywordData[];
  criticalCount: number;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ stats, keywords, criticalCount }) => {
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'monitor' | 'dashboard' | 'ai'>('monitor');

  return (
    <div 
      className={`right-sidebar ${sidebarHovered ? 'expanded' : ''}`}
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
    >
      <div className="right-sidebar-tabs">
        <button 
          className={`right-sidebar-tab ${activeSidebarTab === 'monitor' ? 'active' : ''}`} 
          onClick={() => setActiveSidebarTab('monitor')}
          title="Monitor"
        >
          <Activity size={18} />
        </button>
        <button 
          className={`right-sidebar-tab ${activeSidebarTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setActiveSidebarTab('dashboard')}
          title="Dashboard"
        >
          <LineChart size={18} />
        </button>
        <button 
          className={`right-sidebar-tab ${activeSidebarTab === 'ai' ? 'active' : ''}`} 
          onClick={() => setActiveSidebarTab('ai')}
          title="IA Predictiva"
        >
          <Zap size={18} />
        </button>
      </div>

      <div className="right-sidebar-content">
        {activeSidebarTab === 'monitor' && (
          <div className="sidebar-panel">
            <h3 className="panel-title">Monitor de Actividad</h3>
            <div className="monitor-stats">
              {/* Stat Cards */}
              <div className="stat-card">
                <div className="stat-card-icon"><MessageSquare size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-value">{stats.totalMessages}</div>
                  <div className="stat-label">Mensajes</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><CheckCircle2 size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-value">{stats.respondedMessages}</div>
                  <div className="stat-label">Respondidos</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon"><Clock4 size={18} /></div>
                <div className="stat-card-content">
                  <div className="stat-value">{stats.averageResponseTime}</div>
                  <div className="stat-label">Tiempo medio</div>
                </div>
              </div>
            </div>
            
            <div className="monitor-status">
              <h4 className="section-title">Estado del sistema</h4>
              {/* Status Items */}
              <div className="status-item">
                <div className="status-badge online"></div>
                <div className="status-label">API de mensajería</div>
              </div>
              <div className="status-item">
                <div className="status-badge online"></div>
                <div className="status-label">Servicio de IA</div>
              </div>
              <div className="status-item">
                <div className="status-badge online"></div>
                <div className="status-label">Webhooks</div>
              </div>
            </div>
          </div>
        )}

        {activeSidebarTab === 'dashboard' && (
          <div className="sidebar-panel">
            <h3 className="panel-title">Dashboard</h3>
            <div className="dashboard-summary">
              <div className="chart-container">
                <div className="chart-placeholder"> {/* Placeholder simple */}
                  <div className="chart-bar" style={{ height: '65%' }}></div>
                  <div className="chart-bar" style={{ height: '45%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                  <div className="chart-bar" style={{ height: '55%' }}></div>
                  <div className="chart-bar" style={{ height: '70%' }}></div>
                </div>
                <div className="chart-label">Mensajes por día</div>
              </div>

              <div className="keywords-container">
                <h4 className="section-title">Palabras clave</h4>
                <div className="keywords-list">
                  {keywords.slice(0, 5).map((keyword, index) => (
                    <div key={index} className="keyword-item">
                      <div className="keyword-text">{keyword.word}</div>
                      <div className="keyword-count">{keyword.count}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="critical-indicator">
                <h4 className="section-title">Prioridad alta</h4>
                <div className="critical-count">
                  <Star size={16} />
                  <span>{criticalCount} temas urgentes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSidebarTab === 'ai' && (
          <div className="sidebar-panel">
            <h3 className="panel-title">IA Predictiva</h3>
            <div className="ai-assistant"> {/* Placeholder simple */}
              <div className="ai-insights">
                <h4 className="section-title">Insights</h4>
                <div className="insight-item"><div className="insight-icon"><Grid3X3 size={14} /></div><div className="insight-text">La mayoría de consultas ocurren entre 10-12h</div></div>
                <div className="insight-item"><div className="insight-icon"><Grid3X3 size={14} /></div><div className="insight-text">Temas recurrentes: hora de entrega, productos faltantes</div></div>
              </div>
              <div className="ai-predictions">
                <h4 className="section-title">Tendencias previstas</h4>
                <div className="prediction-chart"><div className="prediction-line"></div></div>
                <div className="prediction-label">Aumento esperado de 20% para mañana</div>
              </div>
              <div className="ai-suggestions">
                <h4 className="section-title">Recomendaciones</h4>
                <div className="suggestion-item"><div className="suggestion-icon"><Settings size={14} /></div><div className="suggestion-text">Aumentar capacidad de respuesta de 9-13h</div></div>
                <div className="suggestion-item"><div className="suggestion-icon"><Settings size={14} /></div><div className="suggestion-text">Crear respuestas automáticas para preguntas comunes</div></div>
              </div>
            </div>
          </div>
        )}
        
        {/* El botón de colapsar podría manejarse internamente o con props */}
        {sidebarHovered && (
           <button className="sidebar-collapse-btn" onClick={() => setSidebarHovered(false)}>
             <ChevronLeft size={18} />
           </button>
        )}
       </div>
     </div>
  );
};

export default RightSidebar; 