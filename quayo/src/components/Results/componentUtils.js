import { 
    CheckSquare, 
    ToggleLeft, 
    Image, 
    Type, 
    Circle, 
    Square, 
    List, 
    SplitSquareVertical,
    Sliders,
    FileText,
    CircleDot,
    AlignLeft
  } from 'lucide-react';
  
  export const getComponentDisplayInfo = (type) => {
    const info = {
      multiple_choice_single: {
        name: 'Single Choice',
        icon: CircleDot,
        color: 'text-blue-500'
      },
      multiple_choice_multi: {
        name: 'Multiple Choice',
        icon: CheckSquare,
        color: 'text-indigo-500'
      },
      true_false: {
        name: 'True/False',
        icon: ToggleLeft,
        color: 'text-green-500'
      },
      image_upload: {
        name: 'Image',
        icon: Image,
        color: 'text-purple-500'
      },
      text: {
        name: 'Text',
        icon: Type,
        color: 'text-gray-500'
      },
      shape: {
        name: 'Shape',
        icon: Circle,
        color: 'text-orange-500'
      },
      single_checkbox: {
        name: 'Checkbox',
        icon: Square,
        color: 'text-blue-500'
      },
      toggle_button: {
        name: 'Toggle',
        icon: ToggleLeft,
        color: 'text-green-500'
      },
      numeric_slider: {
        name: 'Number Slider',
        icon: Sliders,
        color: 'text-red-500'
      },
      discrete_slider: {
        name: 'Choice Slider',
        icon: Sliders,
        color: 'text-yellow-500'
      },
      ranking: {
        name: 'Ranking',
        icon: List,
        color: 'text-purple-500'
      },
      matching_pairs: {
        name: 'Matching',
        icon: SplitSquareVertical,
        color: 'text-indigo-500'
      },
      short_text_answer: {
        name: 'Text Answer',
        icon: FileText,
        color: 'text-gray-500'
      },
      line: {
        name: 'Line',
        icon: AlignLeft,
        color: 'text-gray-500'
      }
    };
  
    return info[type] || {
      name: type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      icon: Square,
      color: 'text-gray-500'
    };
  };
  
  export const formatTime = (milliseconds) => {
    if (!milliseconds || isNaN(milliseconds)) return '--';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  export const formatNumber = (value, defaultValue = '--') => {
    if (value === undefined || value === null || isNaN(value)) return defaultValue;
    return value.toLocaleString();
  };