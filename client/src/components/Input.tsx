import React from 'react';
import './Input.css';

interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  error,
  label,
  required = false,
  disabled = false,
  className = '',
  style = {},
  id,
  name,
  autoComplete,
  autoFocus = false
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputClass = [
    'input',
    error ? 'input-error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="input-container" style={style}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        name={name}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
      {error && <div className="input-error-message">{error}</div>}
    </div>
  );
};

export default Input;