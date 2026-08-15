import React, { useEffect, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Typeahead = ({
  value,
  onChange,
  onSelect,
  fetchOptions,
  renderOption,
  getOptionKey = (item) => item.id,
  placeholder = 'Digite para buscar...',
  minChars = 2,
  debounceMs = 280,
  hint,
  emptyText = 'Nenhum resultado',
  disabled = false,
  selected,
  selectedLabel,
  onClear,
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const handleClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const term = (value || '').trim();
    if (selected || term.length < minChars) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    const requestId = ++requestRef.current;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await fetchOptions(term);
        if (requestRef.current === requestId) {
          setOptions(Array.isArray(results) ? results : []);
          setOpen(true);
        }
      } catch (error) {
        if (requestRef.current === requestId) {
          setOptions([]);
        }
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, minChars, debounceMs, selected, fetchOptions]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
        <div className="min-w-0 text-sm text-gray-900 dark:text-white">
          {selectedLabel}
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-blue-600 dark:text-blue-400 shrink-0"
          >
            Trocar
          </button>
        )}
      </div>
    );
  }

  const term = (value || '').trim();
  const showHint = !loading && term.length < minChars;
  const showEmpty = open && !loading && term.length >= minChars && options.length === 0;

  return (
    <div ref={wrapperRef} className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => term.length >= minChars && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            setOptions([]);
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}

      {open && (showHint || loading || showEmpty || options.length > 0) && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
          {showHint && (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {hint || `Digite pelo menos ${minChars} caracteres`}
            </p>
          )}
          {loading && (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Buscando...</p>
          )}
          {showEmpty && (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
          )}
          {options.map((item) => (
            <button
              key={getOptionKey(item)}
              type="button"
              onClick={() => {
                onSelect(item);
                setOpen(false);
                setOptions([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {renderOption(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Typeahead;
