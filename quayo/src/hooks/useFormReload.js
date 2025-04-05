import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';

/**
 * A custom hook to manage form reloading after AI question generation
 * 
 * @param {Function} loadFormData - Function to reload form data
 * @param {Function} setActiveQuestionId - Function to set the active question ID
 * @returns {Object} Object containing reload state and handlers
 */
export const useFormReload = (loadFormData, setActiveQuestionId) => {
  const [isReloading, setIsReloading] = useState(false);
  const { addToast } = useToast();

  /**
   * Handle when questions are added by the AI
   * 
   * @param {Number} count - Number of questions added
   * @param {Array} newQuestionIds - Array of new question IDs
   */
  const handleQuestionsAdded = useCallback(async (count, newQuestionIds) => {
    console.log(`${count} questions added by AI. Refreshing form...`);
    setIsReloading(true);
    
    try {
      // Reload form data
      await loadFormData();
      
      // If there are new question IDs, select the first one
      if (newQuestionIds && newQuestionIds.length > 0) {
        setActiveQuestionId(newQuestionIds[0]);
      }
      
      // Show success message
      addToast(`${count} questions added successfully!`, "success");
    } catch (error) {
      console.error("Error refreshing form after adding questions:", error);
      addToast("Questions were added but there was an error refreshing the form.", "error");
    } finally {
      setIsReloading(false);
    }
  }, [loadFormData, setActiveQuestionId, addToast]);

  return {
    isReloading,
    handleQuestionsAdded
  };
};

export default useFormReload;