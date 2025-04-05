import { useState, useCallback, useEffect } from "react";
import {
  doc,
  collection,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../components/Toast"; 

export function useQuizAnswers(sessionId, respondentId, formId) {
  const { addToast } = useToast();
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [questionScores, setQuestionScores] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [responseDocId, setResponseDocId] = useState(
    sessionStorage.getItem(`responseId_${sessionId}`) || null
  );


  // Get or create the response document reference
  const getResponseRef = useCallback(() => {
    if (responseDocId) {
      return doc(db, "responses", responseDocId);
    } else {
      const newRef = doc(collection(db, "responses"));
      setResponseDocId(newRef.id);
      sessionStorage.setItem(`responseId_${sessionId}`, newRef.id);
      return newRef;
    }
    
  }, [responseDocId, sessionId]);
  // updateAnswer function to update local answers state
  const updateAnswer = useCallback((questionId, componentId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [componentId]: value,
      },
    }));
  }, []);

  // UPDATED: saveScores now writes respondentId (and formId) along with sessionId.
  const saveScores = async (qScores, tScore, overrideSessionId) => {
    try {
      const responseRef = getResponseRef();
      await setDoc(
        responseRef,
        {
          questionScores: qScores,
          totalScore: tScore,
          sessionId: overrideSessionId || sessionId, // ensure sessionId is set
          respondentId, // add respondentId for Leaderboard join
          formId,       // optionally add formId
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error saving scores:", err);
      setError(err.message);
    }
  };

  // Timer control functions
  const startQuestionTimer = useCallback((questionId) => {
    if (!questionId) {
      console.warn("No questionId provided to startQuestionTimer");
      return;
    }

    setQuestionTimes((prev) => ({
      ...prev,
      activeQuestion: questionId,
      lastActiveTimestamp: Date.now(),
      isTimerActive: true,
    }));
  }, []);

  const pauseQuestionTimer = useCallback(() => {
    setQuestionTimes((prev) => {
      if (!prev.isTimerActive || !prev.activeQuestion) return prev;

      const elapsed = Date.now() - (prev.lastActiveTimestamp || Date.now());
      return {
        ...prev,
        isTimerActive: false,
        lastActiveTimestamp: null,
        accumulatedTimes: {
          ...prev.accumulatedTimes,
          [prev.activeQuestion]: Math.max(
            (prev.accumulatedTimes[prev.activeQuestion] || 0) + elapsed,
            0
          ),
        },
      };
    });
  }, []);

  const resumeQuestionTimer = useCallback((questionId) => {
    setQuestionTimes((prev) => ({
      ...prev,
      activeQuestion: questionId,
      lastActiveTimestamp: Date.now(),
      isTimerActive: true,
    }));
  }, []);

  // Submit question with enhanced tracking
  const submitQuestion = async (questionId, attemptCount, componentResults) => {
    try {
      if (!sessionId || !respondentId || !formId) {
        addToast("Missing session or user information", "error");
        return { success: false };
      }
      setError(null);

      pauseQuestionTimer();
      const responseRef = getResponseRef();

      // Initialize update data
      const updateData = {
        [`questionTimes.${questionId}`]:
          questionTimes.accumulatedTimes[questionId] || 0,
        lastUpdated: serverTimestamp(),
      };

      // Get the current answers for this question
      const questionAnswers = answers[questionId] || {};

      // Add answers to update data if they exist
      if (Object.keys(questionAnswers).length > 0) {
        updateData[`answers.${questionId}`] = questionAnswers;
      }

      // Add attempt count if provided
      if (attemptCount !== undefined) {
        updateData[`attempts.${questionId}`] = attemptCount;
      }

      // Add component results if provided
      if (componentResults) {
        updateData[`componentStatus.${questionId}`] = componentResults;
      }

      // Save to Firebase
      await setDoc(responseRef, updateData, { merge: true });

      // Update local state
      setAttemptsUsed((prev) => ({
        ...prev,
        [questionId]: attemptCount,
      }));

      setComponentStatus((prev) => ({
        ...prev,
        [questionId]: componentResults,
      }));

      return { success: true };
    } catch (err) {
      console.error("Error submitting question:", err);
      addToast(`Error: ${err.message}`, "error");
      return { success: false };
    }
  };

  const cleanupSessionStorage = (sessionId, status = "completed") => {
    // Store submission status separately to allow verification
    if (status === "completed") {
      sessionStorage.setItem(`quizStatus_${sessionId}`, "completed");
    }

    // Clear session-specific data
    sessionStorage.removeItem(`questionTimes_${sessionId}`);
    sessionStorage.removeItem(`attemptsUsed_${sessionId}`);

    // Don't remove responseId as it's needed for verification
    // but mark it as verified
    const responseId = sessionStorage.getItem(`responseId_${sessionId}`);
    if (responseId) {
      sessionStorage.setItem(`responseVerified_${sessionId}`, responseId);
      sessionStorage.removeItem(`responseId_${sessionId}`);
    }
  };

  // Submit all with enhanced data
  const submitAll = async () => {
    try {
      if (!sessionId || !respondentId || !formId) {
        addToast("Missing session or user information", "error");
        return { success: false };
      }
      setError(null);

      const responseRef = getResponseRef();
      await setDoc(
        responseRef,
        {
          respondentId,
          sessionId,
          formId,
          answers,
          attempts: attemptsUsed,
          componentStatus,
          questionTimes: questionTimes.accumulatedTimes,
          totalTimeSpent: Object.values(questionTimes.accumulatedTimes).reduce(
            (sum, time) => sum + time,
            0
          ),
          startTime,
          submittedAt: serverTimestamp(),
          status: "completed",
        },
        { merge: true }
      );

      // Clean up session storage after successful submission
      cleanupSessionStorage(sessionId, "completed");

      addToast("Quiz submitted successfully!", "success");
      return { success: true };
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError(err.message);
      addToast(`Failed to submit quiz: ${err.message}`, "error");
      return { success: false, error: err.message };
    }
  };

  return {
    answers,
    updateAnswer,
    submitQuestion,
    submitAll,
    questionScores,
    setQuestionScores,
    totalScore,
    setTotalScore,
    saveScores,
    error,
    // New tracking-related returns
    attemptsUsed,
    componentStatus,
    questionTimes,
    startQuestionTimer,
    pauseQuestionTimer,
    resumeQuestionTimer,
    handleComponentUpdate,
  };
}
