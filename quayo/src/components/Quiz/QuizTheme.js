// src/components/Quiz/quizTheme.js
export const defaultSizes = {
  text: { width: 256, height: 64 },
  image_upload: { width: 160, height: 160 },
  line: { width: 800, height: 650 }, // Updated height from 600 to 650
  multiple_choice_single: { width: 300, height: 150 },
  multiple_choice_multi: { width: 300, height: 150 },
  true_false: { width: 100, height: 50 },
  custom_component: { width: 384, height: 384 },
  short_text_answer: { width: 250, height: 50 },
  single_checkbox: { width: 100, height: 50 },
  toggle_button: { width: 100, height: 40 },
  numeric_slider: { width: 320, height: 160 },
  discrete_slider: { width: 300, height: 50 },
  ranking: { width: 300, height: 200 },
  matching_pairs: { width: 300, height: 200 },
  shape: { width: 100, height: 100 },
};

export const theme = {
  colors: {
    primary: "#6366F1", // Indigo
    primaryLight: "#EEF2FF",
    primaryDark: "#4F46E5",
    secondary: "#10B981", // Emerald
    secondaryLight: "#ECFDF5",
    secondaryDark: "#059669",
    danger: "#EF4444", // Red
    dangerLight: "#FEE2E2",
    dangerDark: "#B91C1C",
    warning: "#F59E0B", // Amber
    warningLight: "#FEF3C7",
    warningDark: "#D97706",
    neutral: "#6B7280", // Gray
    neutralLight: "#F9FAFB",
    neutralDark: "#374151",
    background: "#F3F4F6",
    white: "#FFFFFF",
    black: "#111827"
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
  animations: {
    bounce: "bounce 1s infinite",
    fadeIn: "fadeIn 0.5s ease-in-out",
    slideIn: "slideIn 0.3s ease-out",
    pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },
  fonts: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
  }
};

// Function to get component style based on its properties
export const getComponentStyle = (comp, defWidth, defHeight) => {
  const width =
    comp.width !== undefined
      ? typeof comp.width === "number"
        ? comp.width + "px"
        : comp.width
      : (defWidth || 0) + "px";
  const height =
    comp.height !== undefined
      ? typeof comp.height === "number"
        ? comp.height + "px"
        : comp.height
      : (defHeight || 0) + "px";
  const left =
    comp.position && comp.position.left !== undefined
      ? typeof comp.position.left === "number"
        ? comp.position.left + "px"
        : comp.position.left
      : "0px";
  const top =
    comp.position && comp.position.top !== undefined
      ? typeof comp.position.top === "number"
        ? comp.position.top + "px"
        : comp.position.top
      : "0px";
  return {
    position: "absolute",
    left,
    top,
    width,
    height,
    display: "block",
    transition: "all 0.2s ease",
  };
};