import React, { useState, useEffect } from 'react';
import { formatInputWithCommas, removeCommas } from '../../lib/utils';

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  currencySymbol?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter amount',
  className = '',
  disabled = false,
  currencySymbol = '',
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Format the value when it changes externally
    if (value === '' || value === null || value === undefined) {
      setDisplayValue('');
    } else {
      const numericValue = typeof value === 'string' ? removeCommas(value) : value.toString();
      setDisplayValue(formatInputWithCommas(numericValue));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove currency symbol if present
    const cleanValue = currencySymbol ? inputValue.replace(currencySymbol, '').trim() : inputValue;
    
    // Format the input
    const formatted = formatInputWithCommas(cleanValue);
    setDisplayValue(formatted);
    
    // Pass the raw numeric value to parent (without commas)
    const rawValue = removeCommas(formatted);
    onChange(rawValue);
  };

  return (
    <div className="relative">
      {currencySymbol && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {currencySymbol}
        </span>
      )}
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${currencySymbol ? 'pl-8' : ''} ${className}`}
      />
    </div>
  );
};