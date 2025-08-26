import React from 'react';
import TimezoneSelector from '../components/settings/TimezoneSelector';

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Configuración General</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Horaria
              </label>
              <TimezoneSelector />
            </div>
            
            {/* Aquí puedes agregar más configuraciones según necesites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notificaciones
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="notifications" className="ml-2 block text-sm text-gray-900">
                  Recibir notificaciones de nuevos mensajes
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;