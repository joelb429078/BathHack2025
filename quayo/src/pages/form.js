// pages/form.js
import React, { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ChevronLeft, PencilLine, Save, Users, Bot, Menu, X, ChevronRight } from "lucide-react";

// Components
import Sidebar from "../components/Form/Sidebar";
import Toolbar from "../components/Form/Toolbar";
import RightToolbar from "../components/Form/RightToolbar";
import FormInfo from "../components/Form/FormInfo";
import Canvas from "../components/Form/Canvas";
import ChatBox from "../components/ChatBox";
import Loading from "../pages/loading";
import SuccessOverlay from "../pages/successoverlay";

// Hooks
import { useFormState } from "../hooks/useFormState";
import { useToast } from "../components/Toast";

// Custom hook to track window dimensions
function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return dimensions;
}

// Custom hook to inject custom styles for FormInfo overlay
function useFormInfoStyles() {
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      .form-info-overlay {
        z-index: 40 !important;
      }
      .form-info-overlay::before {
        content: "";
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        z-index: -1;
      }
      .form-info-content {
        margin-bottom: 2rem !important;
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
}

const Form = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const formStateRef = useRef(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(windowWidth >= 768);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(windowWidth >= 768);
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { addToast } = useToast();

  // Inject custom styles for the FormInfo overlay
  useFormInfoStyles();

  // Handle window resize and orientation warning
  useEffect(() => {
    if (windowWidth < 576 && windowWidth < windowHeight) {
      setShowOrientationWarning(true);
    } else {
      setShowOrientationWarning(false);
    }
    
    // Auto-collapse or expand sidebars based on screen width
    if (windowWidth < 768) {
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
    } else {
      setIsLeftSidebarOpen(true);
      setIsRightSidebarOpen(true);
    }
  }, [windowWidth, windowHeight]);

  const {
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formImage,
    setFormImage,
    questions,
    activeQuestionId,
    setActiveQuestionId,
    showFormInfo,
    setShowFormInfo,
    handleDeleteQuestion,
    handleReorderQuestions,
    handleAddQuestion,
    saveToFirebase,
    handleComponentUpdate,
    handleDeleteComponent,
    handleDrop,
    handleQuestionUpdate,
    isSaving,
  } = useFormState(formId);

  // Select question based on URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const questionToSelect = params.get("selectQuestion");
    if (questionToSelect && questions.some(q => q.id === parseInt(questionToSelect, 10))) {
      setActiveQuestionId(parseInt(questionToSelect, 10));
    }
  }, [questions, setActiveQuestionId]);

  // Calculate sidebar width
  const leftSidebarWidth = useMemo(() => (windowWidth < 1280 ? 240 : 280), [windowWidth]);

  // Reload form function with cache-busting and optional question selection
  const reloadForm = useCallback(async (questionToSelect = null) => {
    setIsLoadingQuestions(true);
    try {
      const url = `/forms/${formId}?reload=${Date.now()}${questionToSelect ? `&selectQuestion=${questionToSelect}` : ''}`;
      navigate(url, { replace: true });
      console.log("Form reloaded successfully");
    } catch (error) {
      console.error("Error reloading form:", error);
      addToast("Error refreshing the form", "error");
      setIsLoadingQuestions(false);
    }
  }, [navigate, formId, addToast]);

  // Handle questions added from AI with a success overlay and form reload
  const handleQuestionsAdded = useCallback(async (count, newQuestionIds) => {
    console.log(`${count} questions added by AI. Refreshing form...`);
    try {
      setShowChatBox(false);
      setSuccessMessage(`${count} question${count !== 1 ? 's' : ''} added successfully!`);
      setShowSuccessOverlay(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const questionToSelect = newQuestionIds && newQuestionIds.length > 0 ? newQuestionIds[0] : null;
      setIsLoadingQuestions(true);
      setTimeout(() => {
        reloadForm(questionToSelect);
      }, 1500);
    } catch (error) {
      console.error("Error refreshing form after adding questions:", error);
      addToast("Questions were added but there was an error refreshing the form.", "error");
      setIsLoadingQuestions(false);
      setShowSuccessOverlay(false);
    }
  }, [reloadForm, addToast]);

  // Expose formState for the ChatBox component
  useEffect(() => {
    formStateRef.current = {
      saveToFirebase,
      loadFormData: reloadForm,
    };
  }, [saveToFirebase, reloadForm]);

  // Pass form state reference to ChatBox
  const handleFormStateReady = useCallback((stateRef) => {
    stateRef.current = formStateRef.current;
  }, []);

  // Handle form image upload
  const handleFormImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Navigate back to forms list
  const handleBack = useCallback(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 fixed inset-0 flex flex-col">
      <SuccessOverlay 
        show={showSuccessOverlay}
        message={successMessage}
        onClose={() => setShowSuccessOverlay(false)}
      />

      {showOrientationWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex flex-col items-center justify-center text-white p-6">
          <div className="transform rotate-90 mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5Z" stroke="white" strokeWidth="2"/>
              <path d="M9 16L15 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="8" r="1" fill="white"/>
              <circle cx="15" cy="16" r="1" fill="white"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Please Rotate Your Device</h2>
          <p className="text-center mb-4">The form builder works best in landscape mode on mobile devices.</p>
          <button 
            onClick={() => setShowOrientationWarning(false)}
            className="px-4 py-2 bg-white text-black font-medium rounded-lg"
          >
            Continue Anyway
          </button>
        </div>
      )}

      {(isSaving || isLoadingQuestions) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <Loading 
            text={isSaving ? "Saving form..." : "Updating questions..."}
            type={isSaving ? "spinner" : "dots"}
            theme={isSaving ? "blue" : "light"}
            size="large" 
          />
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm px-4 md:px-6 py-4 flex items-center overflow-visible">
        {!isLeftSidebarOpen && (
          <button 
            onClick={() => setIsLeftSidebarOpen(true)}
            className="mr-4 p-1.5 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline">Back to Forms</span>
        </button>

        <div className="ml-auto flex items-center gap-2 md:gap-4 overflow-visible">
          <button
            onClick={() => setShowFormInfo(prev => !prev)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow whitespace-nowrap"
          >
            <PencilLine size={16} />
            <span className="hidden sm:inline">Edit Form Info</span>
          </button>

          <button
            onClick={saveToFirebase}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors whitespace-nowrap"
            disabled={isSaving}
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save Form</span>
          </button>

          <button
            onClick={() => navigate(`/sessions/${formId}`)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors whitespace-nowrap"
          >
            <Users size={16} />
            <span className="hidden sm:inline">Go to Sessions</span>
          </button>

          <button
            onClick={() => setShowChatBox(true)}
            className="group relative flex items-center gap-2 px-2 md:px-4 py-2 rounded-xl 
              bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
              hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600
              text-white shadow-lg transition-all duration-300 hover:shadow-xl
              hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <div className="relative flex items-center gap-2">
              <Bot 
                size={16} 
                className="transition-transform group-hover:rotate-12" 
              />
              <span className="hidden sm:inline font-medium">AI Assistant</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 
                animate-pulse group-hover:bg-green-300" />
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Left Sidebar */}
        <div 
          className={`fixed md:static inset-y-0 left-0 z-30 bg-white shadow-lg transform transition-transform duration-300 pt-16 md:pt-0 ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ 
            width: isLeftSidebarOpen ? (windowWidth < 768 ? '240px' : `${leftSidebarWidth}px`) : '0',
            maxWidth: '85vw',
            overflow: 'hidden'
          }}
        >
          <div className="absolute top-3 right-3 p-1 bg-gray-100 rounded-md text-gray-600">
            <button 
              onClick={() => setIsLeftSidebarOpen(false)}
              className="block w-6 h-6 flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="h-full overflow-hidden">
            <Sidebar
              questions={questions}
              activeQuestionId={activeQuestionId}
              setActiveQuestionId={(id) => {
                setActiveQuestionId(id);
                if (windowWidth < 768) {
                  setIsLeftSidebarOpen(false);
                }
              }}
              onAddQuestion={handleAddQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onReorderQuestions={handleReorderQuestions}
              sidebarWidth={isLeftSidebarOpen ? leftSidebarWidth : 0}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden">
          <FormInfo
            show={showFormInfo}
            onClose={() => setShowFormInfo(false)}
            formTitle={formTitle}
            setFormTitle={setFormTitle}
            formDescription={formDescription}
            setFormDescription={setFormDescription}
            formImage={formImage}
            setFormImage={setFormImage}
            handleFormImageUpload={handleFormImageUpload}
          />

          <DndProvider backend={HTML5Backend}>
            <Canvas
              formRef={formRef}
              question={questions.find((q) => q.id === activeQuestionId)}
              onComponentUpdate={handleComponentUpdate}
              onDeleteComponent={handleDeleteComponent}
              handleDrop={handleDrop}
              showFormInfo={showFormInfo}
              onQuestionUpdate={handleQuestionUpdate}
              windowWidth={windowWidth}
              windowHeight={windowHeight}
              isLeftSidebarOpen={isLeftSidebarOpen}
              leftSidebarWidth={isLeftSidebarOpen ? leftSidebarWidth : 0}
              isRightSidebarOpen={isRightSidebarOpen}
              rightSidebarWidth={isRightSidebarOpen ? 64 : 0}
            />
          </DndProvider>
        </div>

        {/* Right Sidebar */}
        <div 
          className={`fixed md:static inset-y-0 right-0 z-20 w-16 bg-white shadow-xl transform transition-transform duration-300 pt-16 md:pt-0 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ 
            overscrollBehavior: 'contain',
            isolation: 'isolate'
          }}
        >
          <div className="absolute top-3 left-3 p-1 bg-gray-100 rounded-md text-gray-600 md:hidden">
            <button 
              onClick={() => setIsRightSidebarOpen(false)}
              className="block w-6 h-6 flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="h-full overflow-auto overscroll-contain">
            <RightToolbar />
          </div>
        </div>
        
        {!isRightSidebarOpen && (
          <button
            onClick={() => setIsRightSidebarOpen(true)}
            className="fixed right-4 bottom-20 z-20 p-2 bg-white border border-gray-200 text-gray-600 rounded-full shadow-lg hover:bg-gray-50"
            aria-label="Open tools"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      <Toolbar 
        questionId={activeQuestionId} 
        isLeftSidebarOpen={isLeftSidebarOpen}
        leftSidebarWidth={leftSidebarWidth}
        isRightSidebarOpen={isRightSidebarOpen}
        windowWidth={windowWidth}
      />

      {showChatBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-11/12 md:w-3/4 lg:w-1/2 h-3/4 max-h-[80vh]">
            <ChatBox 
              formId={formId}
              onClose={() => setShowChatBox(false)}
              onQuestionsAdded={handleQuestionsAdded}
              onFormStateReady={handleFormStateReady}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Form;
