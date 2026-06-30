/**
 * EditableField.jsx
 *
 * Inline contentEditable text field. Standardizes mouse interactions,
 * prevents HTML pastes (coercing plain text), supports keyboard 'Enter' blur,
 * and maintains style formatting.
 */

import { useRef, useEffect } from 'react';

export default function EditableField({ 
  value, 
  onChange, 
  placeholder = "Click to edit...", 
  style = {}, 
  className = "", 
  isEditable = true 
}) {
  const fieldRef = useRef(null);

  // Sync ref value with external changes
  useEffect(() => {
    if (fieldRef.current && fieldRef.current.innerText !== value) {
      fieldRef.current.innerText = value || "";
    }
  }, [value]);

  if (!isEditable) {
    return <span className={className} style={style}>{value || placeholder}</span>;
  }

  const handleBlur = () => {
    if (fieldRef.current) {
      onChange(fieldRef.current.innerText.trim());
    }
  };

  const handleKeyDown = (e) => {
    // For single line inputs, Enter blurs and saves
    if (e.key === 'Enter') {
      e.preventDefault();
      fieldRef.current.blur();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <span
      ref={fieldRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={`editable-field ${className}`}
      style={{
        outline: 'none',
        cursor: 'text',
        display: 'inline-block',
        minWidth: '60px',
        borderBottom: '1px dashed transparent',
        transition: 'all 0.1s ease',
        ...style
      }}
      title="Click to edit inline"
      data-placeholder={placeholder}
    />
  );
}
