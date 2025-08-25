import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Clock, User, Hash } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  onFilterChange?: (filters: SearchFilters) => void;
}

interface SearchFilters {
  type: 'all' | 'contacts' | 'messages' | 'numbers';
  timeRange: 'all' | 'today' | 'week' | 'month';
  hasUnread: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  onSearchTermChange, 
  placeholder = "Buscar...",
  showAdvancedFilters = false,
  onFilterChange
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    timeRange: 'all',
    hasUnread: false
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Guardar búsqueda reciente
  const saveRecentSearch = (term: string) => {
    if (term.trim() && term.length > 2) {
      const newRecentSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recent-searches', JSON.stringify(newRecentSearches));
    }
  };

  // Manejar cambio en el input con debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchTermChange(value);
    
    // Mostrar búsquedas recientes si está vacío o tiene menos de 3 caracteres
    setShowRecentSearches(value.length === 0 || (value.length < 3 && recentSearches.length > 0));
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm);
      setShowRecentSearches(false);
      inputRef.current?.blur();
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    onSearchTermChange('');
    setShowRecentSearches(false);
    inputRef.current?.focus();
  };

  // Seleccionar búsqueda reciente
  const selectRecentSearch = (term: string) => {
    onSearchTermChange(term);
    setShowRecentSearches(false);
    inputRef.current?.blur();
  };

  // Manejar cambio de filtros
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  // Cerrar menús cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowRecentSearches(false);
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar teclas especiales
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowRecentSearches(false);
      setIsFiltersOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="search-container" ref={searchContainerRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <div className="search-icon">
            <Search size={18} />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowRecentSearches(searchTerm.length === 0 && recentSearches.length > 0)}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
          />
          
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="search-clear-btn"
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}

          {showAdvancedFilters && (
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`search-filter-btn ${isFiltersOpen ? 'active' : ''}`}
              aria-label="Filtros avanzados"
            >
              <Filter size={16} />
            </button>
          )}
        </div>

        {/* Búsquedas recientes */}
        {showRecentSearches && recentSearches.length > 0 && (
          <div className="search-dropdown recent-searches">
            <div className="search-dropdown-header">
              <Clock size={14} />
              <span>Búsquedas recientes</span>
            </div>
            {recentSearches.map((term, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectRecentSearch(term)}
                className="search-dropdown-item"
              >
                <Search size={14} />
                <span>{term}</span>
              </button>
            ))}
          </div>
        )}

        {/* Filtros avanzados */}
        {isFiltersOpen && (
          <div className="search-dropdown advanced-filters">
            <div className="search-dropdown-header">
              <Filter size={14} />
              <span>Filtros avanzados</span>
            </div>
            
            {/* Tipo de búsqueda */}
            <div className="filter-group">
              <label className="filter-label">Buscar en:</label>
              <div className="filter-options">
                {[
                  { value: 'all', label: 'Todo', icon: <Search size={14} /> },
                  { value: 'contacts', label: 'Contactos', icon: <User size={14} /> },
                  { value: 'messages', label: 'Mensajes', icon: <Search size={14} /> },
                  { value: 'numbers', label: 'Números', icon: <Hash size={14} /> }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFilterChange({ type: option.value as any })}
                    className={`filter-option ${filters.type === option.value ? 'active' : ''}`}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rango de tiempo */}
            <div className="filter-group">
              <label className="filter-label">Tiempo:</label>
              <div className="filter-options">
                {[
                  { value: 'all', label: 'Todo' },
                  { value: 'today', label: 'Hoy' },
                  { value: 'week', label: 'Esta semana' },
                  { value: 'month', label: 'Este mes' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFilterChange({ timeRange: option.value as any })}
                    className={`filter-option ${filters.timeRange === option.value ? 'active' : ''}`}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Solo no leídos */}
            <div className="filter-group">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.hasUnread}
                  onChange={(e) => handleFilterChange({ hasUnread: e.target.checked })}
                />
                <span className="filter-checkbox-text">Solo no leídos</span>
              </label>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar; 