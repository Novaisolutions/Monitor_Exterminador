import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  Target,
  CheckCircle2,
  Search,
  ExternalLink,
  Clock,
  Zap,
  BarChart3,
  X,
  Eye
} from 'lucide-react';
import { useKommo, KommoLead } from '../../hooks/useKommo';

const KommoView: React.FC = () => {
  const { leads, pipelines, loading, error, stats, getStatusInfo, getLeadsByStatus, refresh } = useKommo();
  const [showLeadDetails, setShowLeadDetails] = useState<KommoLead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto refresh cada 30 segundos si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);



  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando datos de Kommo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kommo-view h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      {/* Header moderno y compacto */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Building2 className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                CRM Kommo - Mayo Dental
              </h1>
              <div className="flex items-center gap-3 text-sm">
                {error && error.includes('demostración') ? (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    Modo demo
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Conectado
                  </div>
                )}
                {stats && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {stats.totalLeads} leads • {formatCurrency(stats.totalValue)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Zap className="h-3 w-3" />
              Auto
            </button>
            
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Estadísticas rápidas */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Leads</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalLeads}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Promedio</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.averageValue)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversión</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline con leads inline */}
        {pipelines.map(pipeline => (
          <div key={pipeline.id} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{pipeline.name}</h2>
            </div>
            
            {/* Grid horizontal de etapas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {pipeline._embedded.statuses.map((status, index) => {
                const statusLeads = getLeadsByStatus(status.id).filter(lead => 
                  !searchTerm || 
                  lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  lead.id.toString().includes(searchTerm)
                );
                const statusValue = statusLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);

                return (
                  <div
                    key={status.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Header de la etapa */}
                    <div 
                      className="p-4 text-white"
                      style={{ backgroundColor: status.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-white/20 px-2 py-1 rounded">#{index + 1}</span>
                            <h3 className="font-semibold">{status.name}</h3>
                          </div>
                          <div className="mt-2 text-sm opacity-90">
                            {statusLeads.length} leads • {formatCurrency(statusValue)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de leads */}
                    <div className="p-3 max-h-96 overflow-y-auto">
                      {statusLeads.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Sin leads</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {statusLeads.map(lead => (
                            <div
                              key={lead.id}
                              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors group"
                              onClick={() => setShowLeadDetails(lead)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                    {lead.name || `Lead #${lead.id}`}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      {formatCurrency(lead.price || 0)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDate(lead.created_at)}
                                    </span>
                                  </div>
                                </div>
                                <Eye className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Modal mejorado de detalles del lead */}
        {showLeadDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header del modal */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {showLeadDetails.name || `Lead #${showLeadDetails.id}`}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        Detalles del lead en CRM
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeadDetails(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Información principal */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">Valor</p>
                          <p className="text-xl font-bold text-green-900 dark:text-green-100">
                            {formatCurrency(showLeadDetails.price || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: getStatusInfo(showLeadDetails.status_id)?.color }}
                        >
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Estado</p>
                          <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            {getStatusInfo(showLeadDetails.status_id)?.name || 'Desconocido'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">ID Lead</p>
                          <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                            #{showLeadDetails.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline de fechas */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timeline del Lead
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Creado</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(showLeadDetails.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Última actualización</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(showLeadDetails.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {showLeadDetails.closed_at && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">Cerrado</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(showLeadDetails.closed_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-3 pt-4">
                    <a
                      href={`https://bizmakermx.kommo.com/leads/detail/${showLeadDetails.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver en Kommo
                    </a>
                    
                    <button
                      onClick={() => setShowLeadDetails(null)}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KommoView;