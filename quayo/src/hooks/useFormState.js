import { useState, useEffect, useCallback } from "react";
import { doc, collection, setDoc, getDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../components/Toast";

const GRID_SIZE = 10;
const CONTAINER_WIDTH = 800;
const CONTAINER_HEIGHT = 600;

export const useFormState = (formId) => {
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState(null);
  const [category, setCategory] = useState("all");
  const [questions, setQuestions] = useState([]);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [showFormInfo, setShowFormInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New state for tracking save status

  const MAX_COMPONENTS = 25;
  const MAX_QUESTIONS = 30;

  const { addToast } = useToast();

  const loadFormData = useCallback(async () => {
    try {
      if (!formId) return;
      const formDocRef = doc(db, "forms", formId);
      const formSnap = await getDoc(formDocRef);
  
      if (formSnap.exists()) {
        const data = formSnap.data();
        setFormTitle(data.formTitle || "");
        setFormDescription(data.formDescription || "");
        setFormImage(data.formImage || null);
        const loadedCategory = data.category || "all";
        setCategory(loadedCategory);
        console.log("useFormState - Loaded form data from Firebase:", { formTitle: data.formTitle, formDescription: data.formDescription, formImage: data.formImage, category: loadedCategory });
      }
  
      const questionsCollRef = collection(formDocRef, "questions");
      const questionsSnap = await getDocs(questionsCollRef);
  
      if (!questionsSnap.empty) {
        const loadedQuestions = questionsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          const comps = (data.components || []).map((c) => {
            if (typeof c.width === "string") c.width = parseInt(c.width, 10) || 100;
            if (typeof c.height === "string") c.height = parseInt(c.height, 10) || 40;
            if (typeof c.opacity === "string") c.opacity = parseFloat(c.opacity) || 1;
            if (typeof c.opacity !== "number") c.opacity = 1;
  
            if (c.type === 'text') {
              if (typeof c.text === 'string') {
                c.text = {
                  text: c.text,
                  format: {
                    bold: false,
                    italic: false,
                    align: 'left',
                    size: 'text-base',
                    color: 'text-gray-900',
                    font: 'Arial'
                  }
                };
              }
              if (!c.text.format) {
                c.text.format = {
                  bold: false,
                  italic: false,
                  align: 'left',
                  size: 'text-base',
                  color: 'text-gray-900',
                  font: 'Arial'
                };
              } else {
                c.text.format = {
                  bold: c.text.format.bold || false,
                  italic: c.text.format.italic || false,
                  align: c.text.format.align || 'left',
                  size: c.text.format.size || 'text-base',
                  color: c.text.format.color || 'text-gray-900',
                  font: c.text.format.font || 'Arial'
                };
              }
            }
            return c;
          });
  
          return {
            id: parseInt(docSnap.id, 10),
            points: data.points ? String(data.points) : "0",
            maxAttempts: data.maxAttempts ? String(data.maxAttempts) : "0",
            components: comps,
            backgroundColor: data.backgroundColor || "#FFFFFF",
            order: data.order || 0
          };
        });
  
        loadedQuestions.sort((a, b) => a.order - b.order);
        setQuestions(loadedQuestions);
        setActiveQuestionId(loadedQuestions[0]?.id);
      } else {
        setQuestions([{ id: 1, points: "0", maxAttempts: "0", components: [], backgroundColor: "#FFFFFF", order: 0 }]);
        setActiveQuestionId(1);
      }
    } catch (err) {
      console.error("Error loading form:", err);
      setQuestions([{ id: 1, points: "0", maxAttempts: "0", components: [], backgroundColor: "#FFFFFF", order: 0 }]);
      setActiveQuestionId(1);
    }
  }, [formId]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const handleSetCategory = (newCategory) => {
    console.log("useFormState - Current category:", category);
    console.log("useFormState - Setting category to:", newCategory);
    setCategory(newCategory);
  };

  const getComponentDimensions = (type) => {
    switch (type) {
      case "image_upload": return { width: 160, height: 160 };
      case "true_false": return { width: 128, height: 56 };
      case "multiple_choice_single": return { width: 288, height: 200 };
      case "multiple_choice_multi": return { width: 288, height: 200 };
      case "text": return { width: 256, height: 64 };
      case "shape": return { width: 100, height: 100 };
      case "single_checkbox": return { width: 48, height: 48 };
      case "toggle_button": return { width: 100, height: 40 };
      case "numeric_slider": return { width: 320, height: 160 };
      case "discrete_slider": return { width: 320, height: 160 };
      case "ranking": return { width: 320, height: 400 };
      case "matching_pairs": return { width: 400, height: 200 };
      default: return { width: 128, height: 56 };
    }
  };

  const handleDrop = (item, x, y) => {
    if (!activeQuestionId) return;
    
    const currentQuestion = questions.find(q => q.id === activeQuestionId);
    if (currentQuestion.components.length >= MAX_COMPONENTS) {
      addToast(`Maximum of ${MAX_COMPONENTS} components reached for this question`, "warning");
      return;
    }

    const dims = item.dimensions || getComponentDimensions(item.type);

    const snappedLeft = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snappedTop = Math.round(y / GRID_SIZE) * GRID_SIZE;

    const left = Math.max(0, Math.min(snappedLeft, CONTAINER_WIDTH - dims.width));
    const top = Math.max(0, Math.min(snappedTop, CONTAINER_HEIGHT - dims.height));

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== activeQuestionId) return q;

        if (typeof item.id !== "undefined") {
          return {
            ...q,
            components: q.components.map((c) =>
              c.id === item.id && c.type !== "line"
                ? { ...c, position: { left, top } }
                : c
            ),
          };
        } else {
          const nextId = Math.max(0, ...q.components.map((c) => c.id), 0) + 1;
          const newComp = createNewComponent(item.type, nextId, left, top, item);
          return {
            ...q,
            components: [...q.components, newComp],
          };
        }
      })
    );
  };

  const createNewComponent = (type, id, left, top, item = {}) => {
    switch (type) {
      case "true_false":
        return { id, type, position: { left, top }, value: false, width: 128, height: 56 };
      case "image_upload":
        return { id, type, position: { left, top }, image: null, width: 160, height: 160 };
      case "text":
        return {
          id,
          type,
          position: { left, top },
          width: 275,
          height: 56,
          text: {
            text: "Double-click to edit",
            format: {
              bold: false,
              italic: false,
              align: 'left',
              size: 'text-base',
              color: 'text-gray-900',
              font: 'Arial'
            }
          }
        };
      case "multiple_choice_single":
        return { id, type, position: { left, top }, options: ["Option 1", "Option 2"], correctIndex: 0, width: 288, height: 200 };
      case "multiple_choice_multi":
        return { id, type, position: { left, top }, options: ["Option A", "Option B"], correctAnswers: [], width: 288, height: 200 };
      case "custom_component":
        return { id, type, position: { left, top }, subItems: [], relationships: [] };
      case "line":
        return { id, type: "line", x1: left, y1: top, x2: left + 100, y2: top };
      case "short_text_answer":
        return { id, type, position: { left, top }, correctAnswer: "" };
      case "single_checkbox":
        return { id, type, position: { left, top }, correctValue: false, width: 48, height: 48 };
      case "toggle_button":
        return { id, type, position: { left, top }, toggled: false, width: 100, height: 40, opacity: 1 };
      case "numeric_slider":
        return { id, type, position: { left, top }, minValue: 0, maxValue: 100, targetValue: 50, currentValue: 50, width: 320, height: 160 };
      case "discrete_slider":
        return { id, type, position: { left, top }, options: ["Very Bad", "Bad", "Neutral", "Good", "Very Good"], selectedIndex: 2, width: 320, height: 160 };
      case "ranking":
        return { id, type, position: { left, top }, items: ["Item 1", "Item 2", "Item 3"], correctOrder: [0, 1, 2], width: 320, height: 220 };
      case "matching_pairs":
        return { id, type, position: { left, top }, pairs: [{ left: "Item 1", right: "Match 1" }, { left: "Item 2", right: "Match 2" }], width: 400, height: 200 };
      case "shape":
        return {
          id,
          type: "shape",
          shapeType: item.shapeType || "circle",
          position: { left, top },
          width: 100,
          height: 100,
          backgroundColor: "#4A90E2",
          borderRadius: 0,
          opacity: 1,
          rotation: 0,
          borderWidth: 0,
          borderColor: "#000000",
          borderStyle: "solid"
        };
      default:
        return { id, type, position: { left, top } };
    }
  };



  const handleDeleteComponent = (questionId, componentId) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, components: q.components.filter((c) => c.id !== componentId) } : q
      )
    );
  };

  const saveToFirebase = async () => {
    try {
      if (!formId) {
        addToast("No formId found!", "error");
        return;
      }

      // Set saving state to show loading overlay
      setIsSaving(true);
      
      // First show an initial "Saving..." toast that won't auto-dismiss
      const savingToastId = Date.now();

      const formDocRef = doc(db, "forms", formId);
      console.log("useFormState - Saving to Firebase:", { formTitle, formDescription, formImage, category });

  return {
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formImage,
    setFormImage,
    category,
    setCategory: handleSetCategory,
    questions,
    setQuestions,
    activeQuestionId,
    setActiveQuestionId,
    showFormInfo,
    setShowFormInfo,
    handleDrop,
    handleAddQuestion,
    handleDeleteQuestion,
    handleReorderQuestions,
    handleQuestionUpdate,
    handleComponentUpdate,
    handleDeleteComponent,
    saveToFirebase,
    isSaving,
    loadFormData
  };
};

export default useFormState;