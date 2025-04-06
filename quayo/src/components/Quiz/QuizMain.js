import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Award, Clock, XCircle, Layers } from "lucide-react";
import { db } from "../../firebase";
import { useToast } from "../../components/Toast";
import { useQuizAnswers } from "../../hooks/useQuizAnswers";
import QuizHeader from './QuizHeader';
import QuestionCard from './QuestionCard';
import QuestionNavigation from './QuestionNavigation';
import Leaderboard from './Leaderboard';
import { 
  checkQuizStatus, 
  calculateTotalPossibleScore,
  isScorableType,
  isRequiredAndUnanswered,
  checkScorableCorrectness
} from './QuizUtils';

const Quiz = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Consolidated state management
  const [quizState, setQuizState] = useState({
    loading: true,
    error: "",
    formData: null,
    questions: [],
    respondentData: null,
    currentQuestionIndex: 0,
    viewMode: "single",
    submittingQuestions: {},
    submittingAll: false,
    validationResults: {},
    timeRemaining: "",
  });

  const [sessionSettings, setSessionSettings] = useState({
    leaderboardEnabled: false,
    deadline: null,
    showComponentHints: false,
    sequentialQuestionMode: true,
  });

  const [attemptsUsed, setAttemptsUsed] = useState(() => 
    JSON.parse(sessionStorage.getItem(`attemptsUsed_${sessionId}`)) || {}
  );

  const [submissionStatus, setSubmissionStatus] = useState(() => 
    JSON.parse(sessionStorage.getItem(`submissionStatus_${sessionId}`)) || {}
  );

  const {
    answers,
    updateAnswer,
    submitQuestion,
    submitAll,
    saveScores,
    questionScores,
    setQuestionScores,
    totalScore,
    setTotalScore,
    error: hookError,
    startQuestionTimer,
    pauseQuestionTimer,
    resumeQuestionTimer,
  } = useQuizAnswers(
    sessionId,
    sessionStorage.getItem(`respondentId_${sessionId}`),
    sessionStorage.getItem(`formId_${sessionId}`)
  );

  // Memoized values
  const totalPossibleScore = useMemo(() => calculateTotalPossibleScore(quizState.questions), [quizState.questions]);
  const timeIsUp = useMemo(() => sessionSettings.deadline && new Date() >= sessionSettings.deadline.toDate(), 
    [sessionSettings.deadline]);

  // Session storage effects
  useEffect(() => {
    sessionStorage.setItem(`attemptsUsed_${sessionId}`, JSON.stringify(attemptsUsed));
  }, [attemptsUsed, sessionId]);

  useEffect(() => {
    sessionStorage.setItem(`submissionStatus_${sessionId}`, JSON.stringify(submissionStatus));
  }, [submissionStatus, sessionId]);

  // Visibility handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentQuestionId = quizState.questions.find((q) => !questionScores[q.id])?.id;
      if (document.hidden) {
        pauseQuestionTimer();
      } else if (currentQuestionId) {
        resumeQuestionTimer(currentQuestionId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pauseQuestionTimer, resumeQuestionTimer, quizState.questions, questionScores]);

  // Data loading
  const loadData = useCallback(async () => {
    try {
      setQuizState(prev => ({ ...prev, loading: true, error: "" }));
      
      const [accessToken, respondentId] = [
        sessionStorage.getItem(`formAccess_${sessionId}`),
        sessionStorage.getItem(`respondentId_${sessionId}`)
      ];
      
      if (!accessToken || !respondentId) {
        navigate(`/form-entrance/${sessionId}`);
        return;
      }

      if (!await checkQuizStatus(sessionId, navigate)) return;

      const sessionRef = doc(db, "sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) throw new Error("Session not found");

      const sessionData = sessionSnap.data();
      const newSettings = {
        leaderboardEnabled: sessionData.leaderboardEnabled || false,
        deadline: sessionData.deadline || null,
        showComponentHints: sessionData.showComponentHints || false,
        sequentialQuestionMode: sessionData.sequentialQuestionMode ?? true,
      };
      setSessionSettings(newSettings);

      setQuizState(prev => ({
        ...prev,
        viewMode: newSettings.sequentialQuestionMode ? "single" : "all"
      }));

      const formId = sessionData.formId;
      sessionStorage.setItem(`formId_${sessionId}`, formId);

      let formData, questions;
      if (sessionData.formSnapshot) {
        const processedSnapshot = {
          ...sessionData.formSnapshot,
          questions: sessionData.formSnapshot.questions
            .map(processQuestion)
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        };
        formData = { id: formId, ...processedSnapshot };
        questions = processedSnapshot.questions;
      } else {
        const [formSnap, questionsSnap] = await Promise.all([
          getDoc(doc(db, "forms", formId)),
          getDocs(collection(db, "forms", formId, "questions")),
        ]);

        if (!formSnap.exists()) throw new Error("Form not found");
        formData = { id: formId, ...formSnap.data() };
        questions = questionsSnap.empty ? [] : questionsSnap.docs
          .map(doc => processQuestion({ id: parseInt(doc.id, 10), ...doc.data() }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      }

      const respondentSnap = await getDoc(doc(db, "respondents", respondentId));
      if (!respondentSnap.exists()) throw new Error("Respondent not found");

      const responseDocId = sessionStorage.getItem(`responseId_${sessionId}`);
      if (responseDocId) {
        const responseSnap = await getDoc(doc(db, "responses", responseDocId));
        if (responseSnap.exists()) {
          const data = responseSnap.data();
          if (data.questionScores) setQuestionScores(data.questionScores);
          if (typeof data.totalScore === "number") setTotalScore(data.totalScore);
        }
      }

      setQuizState(prev => ({
        ...prev,
        formData,
        questions,
        respondentData: { id: respondentId, ...respondentSnap.data() },
      }));
    } catch (err) {
      console.error("Error loading quiz:", err);
      setQuizState(prev => ({ ...prev, error: err.message }));
    } finally {
      setQuizState(prev => ({ ...prev, loading: false }));
    }
  }, [sessionId, navigate, setQuestionScores, setTotalScore]);

  useEffect(() => { loadData(); }, [loadData]);

  // Helper function to process question components
  const processQuestion = (question) => ({
    ...question,
    components: question.components.map(comp => 
      comp.type === "text" ? {
        ...comp,
        text: {
          text: comp.text?.text || comp.text || "",
          format: {
            bold: comp.text?.format?.bold ?? comp.format?.bold ?? false,
            italic: comp.text?.format?.italic ?? comp.format?.italic ?? false,
            align: comp.text?.format?.align ?? comp.format?.align ?? "left",
            size: comp.text?.format?.size ?? comp.format?.size ?? "text-base",
            color: comp.text?.format?.color ?? comp.format?.color ?? "text-gray-900",
            font: comp.text?.format?.font ?? comp.format?.font ?? "Arial",
          },
        },
      } : comp
    ),
  });

  // Timer effect
  useEffect(() => {
    if (!sessionSettings.deadline) return;
    
    const interval = setInterval(() => {
      const diff = sessionSettings.deadline.toDate() - new Date();
      setQuizState(prev => ({
        ...prev,
        timeRemaining: diff <= 0 
          ? "Time's up" 
          : `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`
      }));
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [sessionSettings.deadline]);

  // Question navigation
  useEffect(() => {
    if (quizState.questions.length && !quizState.questions.some(q => questionScores[q.id])) {
      const firstUnanswered = quizState.questions.findIndex(q => !questionScores[q.id]);
      setQuizState(prev => ({ ...prev, currentQuestionIndex: firstUnanswered }));
      startQuestionTimer(quizState.questions[firstUnanswered]?.id);
    }
  }, [quizState.questions, questionScores, startQuestionTimer]);

  const handleViewModeChange = useCallback((mode) => {
    if (sessionSettings.sequentialQuestionMode && mode === "all") {
      addToast('The instructor has set this quiz to question-by-question mode', 'info');
      return;
    }
    setQuizState(prev => ({ ...prev, viewMode: mode }));
  }, [sessionSettings.sequentialQuestionMode, addToast]);

  const handleSubmitAll = useCallback(async () => {
    if (timeIsUp) {
      addToast("Time is up! You can no longer submit the quiz.", "error");
      return;
    }
    
    setQuizState(prev => ({ ...prev, submittingAll: true }));
    try {
      const result = await submitAll();
      if (!result.success) {
        addToast("Time is up! You can no longer submit the quiz.", "warning");
        return;
      }
      await saveScores(questionScores, totalScore, sessionId);
      navigate(`/quiz/${sessionId}/complete`);
    } catch (err) {
      console.error("Error final-submitting quiz:", err);
      addToast("Failed to submit quiz. Please try again.", "error");
    } finally {
      setQuizState(prev => ({ ...prev, submittingAll: false }));
    }
  }, [timeIsUp, submitAll, saveScores, questionScores, totalScore, sessionId, navigate, addToast]);

  const handleSubmitQuestion = useCallback(async (questionId) => {
    if (timeIsUp) {
      addToast("Time is up! You can no longer submit answers.", "warning");
      return;
    }

    setQuizState(prev => ({ ...prev, submittingQuestions: { ...prev.submittingQuestions, [questionId]: true } }));
    const question = quizState.questions.find(q => q.id === questionId);
    if (!question) return;

    try {
      const used = attemptsUsed[questionId] || 0;
      if (questionScores[questionId] || used >= question.maxAttempts) return;

      const scorable = question.components.filter(c => isScorableType(c.type));
      const validation = scorable.reduce((acc, comp) => {
        if (isRequiredAndUnanswered(questionId, comp, answers)) {
          acc[comp.id] = "not-submitted";
        }
        return acc;
      }, {});

      if (Object.keys(validation).length) {
        addToast("Please answer all required parts first.", "warning");
        setQuizState(prev => ({
          ...prev,
          validationResults: { ...prev.validationResults, [questionId]: validation }
        }));
        return;
      }

      const results = scorable.reduce((acc, comp) => {
        const result = checkScorableCorrectness(comp, answers[questionId]?.[comp.id]);
        acc[comp.id] = result;
        return acc;
      }, {});
      
      const allCorrect = Object.values(results).every(r => r === "correct");
      const newUsed = used + 1;
      const result = await submitQuestion(questionId, newUsed, results);

      if (result.success) {
        setValidationResults(prev => ({ ...prev, [questionId]: results }));
        setAttemptsUsed(prev => ({ ...prev, [questionId]: newUsed }));
        setSubmissionStatus(prev => ({
          ...prev,
          [questionId]: { status: allCorrect ? "correct" : "incorrect", attempts: newUsed }
        }));

        if (allCorrect) {
          const pts = question.points || 0;
          const updatedQScores = { ...questionScores, [questionId]: pts };
          setQuestionScores(updatedQScores);
          setTotalScore(prev => prev + pts);
          await saveScores(updatedQScores, totalScore + pts, sessionId);
          addToast(`Great job! You earned ${pts} points!`, "success");

          const nextIndex = quizState.questions.findIndex((q, idx) => 
            idx > quizState.currentQuestionIndex && !updatedQScores[q.id]
          );
          if (nextIndex !== -1) setQuizState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
        } else {
          const remaining = question.maxAttempts - newUsed;
          addToast(
            remaining > 0 
              ? `Not quite right. You have ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` 
              : "No more attempts remaining for this question.",
            remaining > 0 ? "warning" : "error"
          );
          await saveScores(questionScores, totalScore, sessionId);
          
          if (remaining === 0) {
            const nextIndex = quizState.questions W.findIndex((q, idx) => 
              idx > quizState.currentQuestionIndex && !questionScores[q.id]
            );
            if (nextIndex !== -1) setQuizState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
          }
        }
      }
    } catch (err) {
      addToast("An error occurred while submitting.", "error");
      console.error(err);
    } finally {
      setQuizState(prev => ({ 
        ...prev, 
        submittingQuestions: { ...prev.submittingQuestions, [questionId]: false } 
      }));
    }
  }, [timeIsUp, quizState, answers, questionScores, attemptsUsed, submitQuestion, 
      saveScores, totalScore, sessionId, addToast, setQuestionScores, setTotalScore]);

  if (quizState.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-indigo-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 text-lg font-medium text-gray-600">Loading quiz...</p>
      </div>
    );
  }

  if (quizState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-l-4 border-red-500">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-red-100 p-2 mr-3">
              <XCircle size={24} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Error</h2>
          </div>
          <p className="text-gray-700 mb-4">{quizState.error}</p>
          <button 
            onClick={() => navigate(`/form-entrance/${sessionId}`)}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <QuizHeader 
            formData={quizState.formData}
            respondentData={quizState.respondentData}
            timeRemaining={quizState.timeRemaining}
            isTimeUp={timeIsUp}
            totalScore={totalScore}
            totalPossible={totalPossibleScore}
            questions={quizState.questions}
            questionScores={questionScores}
            submissionStatus={submissionStatus}
          />

          <div className="mb-6 flex justify-center flex-col items-center">
            {sessionSettings.sequentialQuestionMode ? (
              <>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg py-2 px-4 mb-3 flex items-center">
                  <Layers size={16} className="text-indigo-600 mr-2" />
                  <span className="text-sm text-indigo-700 font-medium">
                    The instructor has set this quiz to question-by-question mode
                  </span>
                </div>
                <div className="bg-white rounded-full p-1 flex shadow-sm opacity-90">
                  <div className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    Question by Question
                  </div>
                  <div className="px-4 py-2 rounded-full text-sm font-medium text-gray-400 cursor-not-allowed">
                    Continuous View
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center text-sm text-gray-500">
                  <Layers size={16} className="mr-1.5" />
                  <span>Select your preferred view mode:</span>
                </div>
                <div className="bg-white rounded-full p-1 flex shadow-sm">
                  {["single", "all"].map(mode => (
                    <button
                      key={mode}
                      onClick={() => handleViewModeChange(mode)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        quizState.viewMode === mode 
                          ? "bg-indigo-100 text-indigo-800" 
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      {mode === "single" ? "Question by Question" : "Continuous View"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {quizState.viewMode === "single" ? (
            quizState.questions.length > 0 && (
              <>
                <QuestionCard 
                  question={quizState.questions[quizState.currentQuestionIndex]}
                  index={quizState.currentQuestionIndex}
                  answers={answers}
                  updateAnswer={updateAnswer}
                  validationResults={quizState.validationResults}
                  attemptsUsed={attemptsUsed}
                  questionScores={questionScores}
                  submittingQuestions={quizState.submittingQuestions}
                  handleSubmitQuestion={handleSubmitQuestion}
                  sessionSettings={sessionSettings}
                  timeIsUp={timeIsUp}
                />
                <QuestionNavigation 
                  questions={quizState.questions}
                  currentQuestionIndex={quizState.currentQuestionIndex}
                  questionScores={questionScores}
                  submissionStatus={submissionStatus}
                  onNavigate={index => setQuizState(prev => ({ ...prev, currentQuestionIndex: index }))}
                />
              </>
            )
          ) : (
            <div className="space-y-8">
              {quizState.questions.map((question, idx) => (
                <QuestionCard 
                  key={question.id}
                  question={question}
                  index={idx}
                  answers={answers}
                  updateAnswer={updateAnswer}
                  validationResults={quizState.validationResults}
                  attemptsUsed={attemptsUsed}
                  questionScores={questionScores}
                  submittingQuestions={quizState.submittingQuestions}
                  handleSubmitQuestion={handleSubmitQuestion}
                  sessionSettings={sessionSettings}
                  timeIsUp={timeIsUp}
                />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <button
              onClick={handleSubmitAll}
              disabled={quizState.submittingAll || timeIsUp}
              className={`group relative inline-flex items-center justify-center py-3 px-8 rounded-xl text-white text-lg font-bold transition-all ${
                quizState.submittingAll || timeIsUp
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {quizState.submittingAll ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Quiz
                  <span className="absolute right-0 -mt-12 opacity-0 group-hover:opacity-100 group-hover:mt-0 transition-all duration-300">
                    <Award size={24} className="ml-2" />
                  </span>
                </>
              )}
            </button>
            <p className="mt-3 text-sm text-gray-500">
              You've completed {Object.keys(questionScores).length} of {quizState.questions.length} questions. 
              {Object.keys(questionScores).length < quizState.questions.length 
                ? " Answer all questions for the best score." 
                : " You're ready to submit!"}
            </p>
          </div>

          {sessionSettings.leaderboardEnabled && (
            <div className="mt-16">
              <Leaderboard sessionId={sessionId} />
            </div>
          )}

          {hookError && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{hookError}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {timeIsUp && (
        <div className="fixed inset-0 bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={48} className="text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-red-600 mb-2">Time's Up!</h2>
            <p className="text-gray-700 text-lg mb-6">
              The quiz submission deadline has passed. You can no longer submit answers.
            </p>
            <button
              onClick={() => navigate(`/quiz/${sessionId}/complete`)}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              View Results
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Quiz;