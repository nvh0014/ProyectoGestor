import React, { useState, useEffect, useRef } from 'react';
import './Autocomplete.css';

const Autocomplete = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Buscar...", 
  displayKey = "name", 
  valueKey = "value",
  searchKeys = ["name"],
  maxResults = 10,
  className = "",
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [displayValue, setDisplayValue] = useState('');
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filtrar opciones basado en el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions([]);
      return;
    }

    const filtered = options.filter(option => {
      if (!option) return false;
      
      return searchKeys.some(key => {
        const value = option[key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    }).slice(0, maxResults);

    setFilteredOptions(filtered);
    setSelectedIndex(-1);
  }, [searchTerm, options, searchKeys, maxResults]);

  // Actualizar display value cuando cambia el value seleccionado
  useEffect(() => {
    if (value && options.length > 0) {
      const selectedOption = options.find(option => option && option[valueKey] === value);
      if (selectedOption) {
        setDisplayValue(selectedOption[displayKey] || '');
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value, options, displayKey, valueKey]);

  // Manejar clicks fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setDisplayValue(term);
    setIsOpen(true);
    
    // Si el input está vacío, limpiar la selección
    if (!term.trim()) {
      onChange('');
    }
  };

  const handleOptionClick = (option) => {
    if (!option) return;
    
    setDisplayValue(option[displayKey] || '');
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onChange(option[valueKey]);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleOptionClick(filteredOptions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    // Mostrar todas las opciones cuando se hace focus si no hay término de búsqueda
    if (!searchTerm.trim() && options.length > 0) {
      setFilteredOptions(options.slice(0, maxResults));
      setIsOpen(true);
    } else if (searchTerm.trim()) {
      setIsOpen(true);
    }
  };

  const clearSelection = () => {
    setDisplayValue('');
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`autocomplete-container ${className}`} ref={dropdownRef}>
      <div className="autocomplete-input-container">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="autocomplete-input"
          disabled={disabled}
          required={required}
          autoComplete="off"
        />
        
        {value && (
          <button
            type="button"
            className="autocomplete-clear-button"
            onClick={clearSelection}
            aria-label="Limpiar selección"
          >
            ✕
          </button>
        )}
        
        <div className="autocomplete-icon">
          <i className="fas fa-search"></i>
        </div>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="autocomplete-dropdown">
          {filteredOptions.map((option, index) => {
            if (!option) return null;
            
            return (
              <div
                key={option[valueKey] || index}
                className={`autocomplete-option ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="option-main">
                  {option[displayKey] || 'Sin nombre'}
                </div>
                {option.subtitle && (
                  <div className="option-subtitle">
                    {option.subtitle}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isOpen && searchTerm.trim() && filteredOptions.length === 0 && (
        <div className="autocomplete-dropdown">
          <div className="autocomplete-no-results">
            No se encontraron resultados
          </div>
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
