import React from 'react';
import { COMMON_TIMEZONES } from '../../hooks/useSettings';

interface TimeZoneSelectorProps {
  selectedTimeZone: string;
  onChange: (timeZone: string) => void;
}

const TimeZoneSelector: React.FC<TimeZoneSelectorProps> = ({ 
  selectedTimeZone, 
  onChange 
}) => {
  return (
    <div className="settings-control">
      <label htmlFor="timezone-select" className="settings-label">
        Zona horaria
      </label>
      <select
        id="timezone-select"
        className="settings-select"
        value={selectedTimeZone}
        onChange={(e) => onChange(e.target.value)}
      >
        {COMMON_TIMEZONES.map((zone) => (
          <option key={zone.value} value={zone.value}>
            {zone.label}
          </option>
        ))}
      </select>
      <p className="settings-help">
        Esta configuración afecta cómo se muestran las fechas y horas en la aplicación.
      </p>
    </div>
  );
};

export default TimeZoneSelector; 