// quiz.js – Entry point for the quiz view
import React, { useEffect } from "react";
import { ToastProvider } from "../components/Toast";
import { Quiz } from "../components/Quiz/QuizMain";
import "../components/Quiz/QuizStyles.css";

// Inline responsive styles (consider moving this to a separate CSS file if it grows)
const responsiveStyles = `
  .canvas-wrapper {
    width: 100%;
    overflow: hidden;
  }

  .canvas-container {
    overflow: visible !important;
    transition: all 0.3s ease-out;
  }

  .question-component {
    transform-origin: center center;
  }

  @media (max-width: 480px) {
    .question-component input,
    .question-component button,
    .question-component select,
    .question-component textarea {
      font-size: 16px !important;
    }

    .question-component label,
    .question-component span {
      font-size: 14px !important;
    }
  }

  @media (max-height: 480px) and (orientation: landscape) {
    .quiz-header, .quiz-footer,
    .canvas-wrapper {
      padding: 0 !important;
      margin: 0 !important;
    }

    .question-component input,
    .question-component button,
    .question-component select,
    .question-component span,
    .question-component label {
      font-size: 120% !important;
    }
  }

  body.quiz-active {
    overflow-x: hidden;
    max-width: 100vw;
  }

  .quiz-card {
    max-width: 100%;
    overflow: hidden;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }

  .orientation-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    .quiz-header {
      margin-bottom: 0 !important;
    }
    .quiz-footer {
      margin-top: 0 !important;
    }
  }

  @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
    .canvas-wrapper {
      padding-bottom: 1rem;
    }
  }
`;

const ResponsiveStyles = () => <style>{responsiveStyles}</style>;

const QuizWithToast = () => {
  useEffect(() => {
    document.body.classList.add("quiz-active");
    return () => document.body.classList.remove("quiz-active");
  }, []);

  return (
    <ToastProvider>
      <ResponsiveStyles />
      <Quiz />
    </ToastProvider>
  );
};

export default QuizWithToast;
