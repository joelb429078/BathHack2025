import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Check } from 'lucide-react';
import BaseDraggable from './BaseDraggable';
import { 
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Palette,
  Type as FontIcon
} from 'lucide-react';

const FONT_SIZES = {
  'text-sm': { height: 48, label: 'Compact' },
  'text-base': { height: 56, label: 'Regular' },
  'text-lg': { height: 64, label: 'Medium' },
  'text-xl': { height: 72, label: 'Large' },
  'text-2xl': { height: 80, label: 'Header' }
};

const TEXT_COLORS = {
  'text-gray-900': { label: 'Black', value: '#111827' },
  'text-blue-600': { label: 'Blue', value: '#2563eb' },
  'text-red-600': { label: 'Red', value: '#dc2626' },
  'text-green-600': { label: 'Green', value: '#16a34a' },
  'text-purple-600': { label: 'Purple', value: '#9333ea' },
  'text-yellow-600': { label: 'Yellow', value: '#ca8a04' }
};

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
  'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
  'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Sans', 'Tahoma',
  'Geneva', 'Optima', 'Futura', 'Century Gothic', 'Gill Sans',
  'Baskerville', 'Calibri', 'Cambria', 'Candara', 'Consolas',
  'Corbel', 'Franklin Gothic', 'Myriad Pro', 'Segoe UI', 'Roboto'
];

const calculateHeight = (size) => {
  return FONT_SIZES[size]?.height || FONT_SIZES['text-base'].height;
};

const FormattingToolbar = ({ onFormat, currentFormat, toolbarRef }) => {
  const [showFontSize, setShowFontSize] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showFonts, setShowFonts] = useState(false);
  const [customColor, setCustomColor] = useState(null);
  const colorInputRef = useRef(null);
  
  useEffect(() => {
    // Check if current color is a custom color
    if (currentFormat.color && currentFormat.color.startsWith('#')) {
      setCustomColor(currentFormat.color);
    } else {
      setCustomColor(null);
    }
  }, [currentFormat.color]);
  
  const handleColorChange = (e) => {
    const color = e.target.value;
    onFormat('color', color);
  };

  // Function to get color from presets or default
  const getCurrentColorValue = () => {
    if (customColor) return customColor;
    if (currentFormat.color && TEXT_COLORS[currentFormat.color]) {
      return TEXT_COLORS[currentFormat.color].value;
    }
    return '#000000';
  };
  
  return (
    <div 
      ref={toolbarRef}
      className="absolute -top-14 left-0 bg-white rounded-lg shadow-lg border p-2"
      style={{ 
        zIndex: 1000,
        width: 'fit-content',
        minWidth: '320px'
      }}
      data-nodrag="true"
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => onFormat('bold')}
          className={`p-1.5 rounded hover:bg-gray-100 ${currentFormat.bold ? 'bg-gray-100' : ''}`}
          data-nodrag="true"
          title="Bold"
        >
          <Bold size={14} />
        </button>
        
        <button
          onClick={() => onFormat('italic')}
          className={`p-1.5 rounded hover:bg-gray-100 ${currentFormat.italic ? 'bg-gray-100' : ''}`}
          data-nodrag="true"
          title="Italic"
        >
          <Italic size={14} />
        </button>
        
        <div className="w-px h-4 bg-gray-200 mx-1" />
        
        <button
          onClick={() => onFormat('align', 'left')}
          className={`p-1.5 rounded hover:bg-gray-100 ${currentFormat.align === 'left' ? 'bg-gray-100' : ''}`}
          data-nodrag="true"
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        
        <button
          onClick={() => onFormat('align', 'center')}
          className={`p-1.5 rounded hover:bg-gray-100 ${currentFormat.align === 'center' ? 'bg-gray-100' : ''}`}
          data-nodrag="true"
          title="Center"
        >
          <AlignCenter size={14} />
        </button>
        
        <button
          onClick={() => onFormat('align', 'right')}
          className={`p-1.5 rounded hover:bg-gray-100 ${currentFormat.align === 'right' ? 'bg-gray-100' : ''}`}
          data-nodrag="true"
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>
        
        <div className="w-px h-4 bg-gray-200 mx-1" />
        
        <div className="relative">
          <button
            onClick={() => {
              setShowFontSize(!showFontSize);
              setShowColors(false);
              setShowFonts(false);
            }}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-100"
            data-nodrag="true"
          >
            <span className="text-sm">Size</span>
            <ChevronDown size={14} />
          </button>
          
          {showFontSize && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-1 w-32"
              style={{ zIndex: 1001 }}
              data-nodrag="true"
            >
              {Object.entries(FONT_SIZES).map(([size, { label }]) => (
                <button
                  key={size}
                  onClick={() => {
                    onFormat('size', size);
                    setShowFontSize(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-gray-100 
                    ${currentFormat.size === size ? 'bg-gray-50' : ''}`}
                  data-nodrag="true"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowColors(!showColors);
              setShowFontSize(false);
              setShowFonts(false);
            }}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-100"
            data-nodrag="true"
            title="Text Color"
          >
            <div className="relative">
              <Palette size={14} />
              {customColor && (
                <div 
                  className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full" 
                  style={{ backgroundColor: customColor }}
                />
              )}
            </div>
          </button>
          
          {showColors && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-2 w-52"
              style={{ zIndex: 1001 }}
              data-nodrag="true"
            >
              {/* Color picker */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={getCurrentColorValue()}
                    onChange={handleColorChange}
                    className="w-full h-8 cursor-pointer rounded-lg"
                    data-nodrag="true"
                  />
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-px bg-gray-200 my-2"></div>
              
              {/* Preset colors */}
              <div className="text-xs text-gray-500 mb-1">Preset Colors</div>
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(TEXT_COLORS).map(([colorClass, { label, value }]) => (
                  <button
                    key={colorClass}
                    onClick={() => {
                      onFormat('color', colorClass);
                      setShowColors(false);
                    }}
                    className={`px-2 py-1.5 rounded text-sm hover:bg-gray-100 
                      flex items-center gap-2 ${currentFormat.color === colorClass ? 'bg-gray-50' : ''}`}
                    data-nodrag="true"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: value }}
                    />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowFonts(!showFonts);
              setShowFontSize(false);
              setShowColors(false);
            }}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-100"
            data-nodrag="true"
            title="Font Family"
          >
            <FontIcon size={14} />
            <ChevronDown size={14} />
          </button>
          
          {showFonts && (
            <div 
              className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border p-1 w-48 max-h-60 overflow-y-auto"
              style={{ zIndex: 1001 }}
              data-nodrag="true"
            >
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font}
                  onClick={() => {
                    onFormat('font', font);
                    setShowFonts(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-gray-100 
                    ${currentFormat.font === font ? 'bg-gray-50' : ''}`}
                  style={{ fontFamily: font }}
                  data-nodrag="true"
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FormattedTextItem = ({ id, position, text = {}, setText, onDelete, onResize, width = 260, height }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(text?.text || "");
  const [format, setFormat] = useState({
    bold: text?.format?.bold || false,
    italic: text?.format?.italic || false,
    align: text?.format?.align || 'left',
    size: text?.format?.size || 'text-base',
    color: text?.format?.color || 'text-gray-900',
    font: text?.format?.font || 'Arial'
  });
  
  const inputRef = useRef(null);
  const toolbarRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (text?.format) {
      setFormat(text.format);
    }
    if (text?.text) {
      setInputValue(text.text);
    }
  }, [text]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (inputValue !== text?.text || JSON.stringify(format) !== JSON.stringify(text?.format)) {
      setText(id, inputValue, format);
    }
  }, [id, inputValue, text, format, setText]);

  const handleClickOutside = useCallback((e) => {
    const isToolbarClick = toolbarRef.current && toolbarRef.current.contains(e.target);
    const isContainerClick = containerRef.current && containerRef.current.contains(e.target);
    
    if (!(isToolbarClick || isContainerClick)) {
      handleBlur();
    }
  }, [handleBlur]);

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleClickOutside]);

  const computedHeight = height || calculateHeight(format.size);

  const handleFormat = (type, value) => {
    setFormat(prev => {
      const newFormat = type === 'bold' || type === 'italic'
        ? { ...prev, [type]: !prev[type] }
        : { ...prev, [type]: value };
  
      if (type === 'size' && onResize) {
        const newMinHeight = calculateHeight(value);
        if (!height || height < newMinHeight) {
          onResize(id, { height: newMinHeight });
        }
      }
  
      return newFormat;
    });
  };

  const getTextClasses = () => {
    let classes = [format.size];
    
    // Handle color - can be a Tailwind class or custom hex color
    if (format.color && format.color.startsWith('#')) {
      // Custom color, will be applied as inline style
      classes.push('');
    } else {
      // Tailwind class
      classes.push(format.color);
    }
    
    if (format.bold) classes.push('font-bold');
    if (format.italic) classes.push('italic');
    
    switch (format.align) {
      case 'center': classes.push('text-center'); break;
      case 'right': classes.push('text-right'); break;
      default: classes.push('text-left');
    }
    
    return classes.join(' ');
  };

  const getTextStyle = () => {
    const style = { fontFamily: format.font };
    
    // Add custom color if it's a hex value
    if (format.color && format.color.startsWith('#')) {
      style.color = format.color;
    }
    
    return style;
  };

  return (
    <BaseDraggable
      id={id}
      type="text"
      position={position}
      width={width}
      height={height || computedHeight}
      className="group"
      onDelete={onDelete}
      onResize={(cid, dims) => {
        if (onResize) {
          const minHeight = calculateHeight(format.size);
          onResize(cid, {
            ...dims,
            height: Math.max(dims.height, minHeight)
          });
        }
      }}
      style={{
        background: 'transparent',
        border: 'none',
        boxShadow: 'none'
      }}
      minWidth={200}
      minHeight={calculateHeight(format.size)}
    >
      <div className="w-full h-full">
        {isEditing && (
          <FormattingToolbar 
            onFormat={handleFormat}
            currentFormat={format}
            toolbarRef={toolbarRef}
          />
        )}

        <div 
          ref={containerRef}
          className="w-full h-full rounded-lg bg-white border-2 border-gray-200 hover:border-gray-300"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <div className="w-full h-full p-3 flex items-center gap-3">
            <div className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0">
              <Type size={20} />
            </div>
            
            {isEditing ? (
              <div className="flex-1 flex items-center min-w-0">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBlur();
                  }}
                  className={`flex-1 px-2 py-1 border-b-2 border-blue-500 focus:outline-none
                    bg-transparent min-w-0 ${getTextClasses()}`}
                  style={getTextStyle()}
                  placeholder="Enter text..."
                  data-nodrag="true"
                />
                <button
                  onClick={handleBlur}
                  className="ml-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-500
                    hover:text-gray-700 transition-colors flex-shrink-0"
                  data-nodrag="true"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div 
                className={`flex-1 truncate ${getTextClasses()}`}
                style={getTextStyle()}
              >
                {inputValue || "Double-click to edit"}
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseDraggable>
  );
};

export default FormattedTextItem;