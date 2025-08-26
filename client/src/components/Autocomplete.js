import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState({});
  
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
      // Verificar si el click fue fuera del input container o del dropdown
      const clickedInput = inputRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);
      
      if (!clickedInput && !clickedDropdown) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular posición del dropdown
  const calculateDropdownPosition = () => {
    if (!inputRef.current) return {};
    
    const rect = inputRef.current.getBoundingClientRect();
    
    // Detectar si es móvil
    const isMobile = window.innerWidth <= 768;
    
    // Verificar si hay espacio suficiente hacia abajo
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = isMobile ? 120 : 180; // Altura reducida para mejor proximidad
    
    const shouldShowAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
    
    // Configuración específica para móviles
    if (isMobile) {
      return {
        position: 'fixed',
        top: shouldShowAbove ? rect.top - dropdownHeight - 2 : rect.bottom + 2, // Espaciado mínimo
        left: Math.max(15, rect.left),
        width: Math.min(rect.width, window.innerWidth - 30),
        maxWidth: window.innerWidth - 30,
        minWidth: Math.min(250, window.innerWidth - 30),
        zIndex: 999999
      };
    }
    
    // Configuración para escritorio - más cerca del input
    return {
      position: 'fixed',
      top: shouldShowAbove ? rect.top - dropdownHeight - 2 : rect.bottom + 2, // Solo 2px de separación
      left: rect.left,
      width: Math.max(rect.width, 300), // Ancho mínimo reducido
      maxWidth: Math.min(450, window.innerWidth - rect.left - 20), // Máximo reducido
      zIndex: 999999
    };
  };

  // Actualizar posición cuando se abre el dropdown
  useEffect(() => {
    if (isOpen) {
      setDropdownPosition(calculateDropdownPosition());
      
      // Recalcular posición en scroll y resize
      const handlePositionUpdate = () => {
        if (isOpen) {
          setDropdownPosition(calculateDropdownPosition());
        }
      };
      
      window.addEventListener('scroll', handlePositionUpdate, true);
      window.addEventListener('resize', handlePositionUpdate);
      
      return () => {
        window.removeEventListener('scroll', handlePositionUpdate, true);
        window.removeEventListener('resize', handlePositionUpdate);
      };
    }
  }, [isOpen]);

  // Limpiar dropdown al desmontar el componente
  useEffect(() => {
    return () => {
      setIsOpen(false);
    };
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

  // Renderizar dropdown usando portal para asegurar que esté por encima de todo
  const renderDropdown = () => {
    if (!isOpen) return null;

    // Detectar si es móvil para aplicar estilos específicos
    const isMobile = window.innerWidth <= 768;

    const dropdownContent = (
      <div 
        className={`autocomplete-dropdown ${isMobile ? 'mobile' : ''}`}
        style={dropdownPosition}
        ref={dropdownRef}
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => {
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
                <div className="option-main" title={option[displayKey] || 'Sin nombre'}>
                  {option[displayKey] || 'Sin nombre'}
                </div>
                {option.subtitle && (
                  <div className="option-subtitle" title={option.subtitle}>
                    {option.subtitle}
                  </div>
                )}
              </div>
            );
          })
        ) : searchTerm.trim() ? (
          <div className="autocomplete-no-results">
            No se encontraron resultados
          </div>
        ) : null}
      </div>
    );

    // Usar portal para renderizar el dropdown en el body
    return createPortal(dropdownContent, document.body);
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

      {/* Renderizar dropdown usando portal */}
      {renderDropdown()}
    </div>
  );
};

export default Autocomplete;
