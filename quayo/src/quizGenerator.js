// services/quizGeneratorUtils.js
import { doc, collection, setDoc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Appends questions to an existing form
 * @param {string} formId - The ID of the form to add questions to
 * @param {Array} questions - Array of question objects to append
 * @returns {Promise<number>} - Number of questions added
 */
export const appendQuestionsToForm = async (formId, questions) => {
  try {
    if (!formId) {
      throw new Error("No form ID provided");
    }
    
    console.log("Appending questions to form:", formId);
    console.log("Question data:", JSON.stringify(questions, null, 2));
    
    // Get the current form data
    const formDocRef = doc(db, "forms", formId);
    const formSnapshot = await getDoc(formDocRef);
    
    if (!formSnapshot.exists()) {
      throw new Error("Form not found");
    }
    
    // Get existing questions to determine proper ordering
    const questionsCollRef = collection(formDocRef, "questions");
    const questionsSnapshot = await getDocs(questionsCollRef);
    
    const existingQuestions = questionsSnapshot.docs.map(doc => ({
      id: parseInt(doc.id),
      ...doc.data()
    }));
    
    // Sort by order to find the highest order value
    const sortedQuestions = [...existingQuestions].sort((a, b) => a.order - b.order);
    const lastOrder = sortedQuestions.length > 0 ? sortedQuestions[sortedQuestions.length - 1].order : -1;
    const lastId = sortedQuestions.length > 0 
      ? Math.max(...sortedQuestions.map(q => parseInt(q.id)))
      : 0;
    
    console.log("Last question ID:", lastId);
    console.log("Last question order:", lastOrder);
    
    // Add new questions with correct order and ID
    let addedCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const newId = lastId + i + 1;
      const newOrder = lastOrder + i + 1;
      
      console.log(`Adding question ${newId} with order ${newOrder}`);
      
      const questionDocRef = doc(collection(formDocRef, "questions"), newId.toString());
      
      await setDoc(questionDocRef, {
        id: newId,
        backgroundColor: question.backgroundColor || "#FFFFFF",
        points: question.points || 0,
        maxAttempts: question.maxAttempts || 0,
        order: newOrder,
        components: question.components || []
      });
      
      addedCount++;
    }
    
    console.log(`Added ${addedCount} questions to form`);
    return addedCount;
  } catch (error) {
    console.error("Error appending questions:", error);
    throw error;
  }
};

/**
 * Parses JSON quiz data from AI response
 * @param {string} responseText - The text response from the AI
 * @returns {Array|null} - Array of questions or null if not found
 */
export const extractQuestionsFromResponse = (responseText) => {
  try {
    // Try to find JSON structure in the response with various patterns
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     responseText.match(/```\s*([\[\{][\s\S]*?[\]\}])\s*```/) ||
                     responseText.match(/\[\s*\{\s*"backgroundColor"[\s\S]*\}\s*\]/);
    
    if (!jsonMatch) {
      console.log("No JSON match found in the response");
      return null;
    }
    
    const jsonString = jsonMatch[1] || jsonMatch[0];
    console.log("Extracted JSON:", jsonString.substring(0, 200) + "...");
    
    // Parse the JSON string
    const parsedData = JSON.parse(jsonString.replace(/```/g, '').trim());
    
    // If we have an array of questions, use it directly
    if (Array.isArray(parsedData)) {
      return parsedData;
    } 
    // If we have a complete form object with questions array, extract and use the questions
    else if (parsedData.questions && Array.isArray(parsedData.questions)) {
      return parsedData.questions;
    }
    // If we have a single question object, wrap it in an array
    else if (parsedData.components && Array.isArray(parsedData.components)) {
      return [parsedData];
    }
    
    // If we can't determine the structure, return null
    return null;
  } catch (error) {
    console.error("Error parsing quiz data:", error);
    return null;
  }
};

/**
 * Creates a human-readable response by removing JSON from the original response
 * @param {string} responseText - The original response text
 * @param {number} addedCount - Number of questions added
 * @returns {string} - User-friendly response
 */
export const createUserFriendlyResponse = (responseText, addedCount) => {
  // Remove JSON blocks from the response
  const cleanedResponse = responseText.replace(/```json[\s\S]*?```/g, '').trim();
  
  // Add confirmation about the added questions
  return `${cleanedResponse}\n\nI've added ${addedCount} new question${addedCount !== 1 ? 's' : ''} to your form. You can now edit these questions further or use them as they are.`;
};

// Named exports
export const quizGeneratorUtils = {
  appendQuestionsToForm,
  extractQuestionsFromResponse,
  createUserFriendlyResponse
};

// Default export
export default quizGeneratorUtils;