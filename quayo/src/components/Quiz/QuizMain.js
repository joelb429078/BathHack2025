import React, { useEffect, useState } from "react";
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

export const Quiz = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [respondentData, setRespondentData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { addToast } = useToast();

  const [sessionSettings, setSessionSettings] = useState({
    leaderboardEnabled: false,
    deadline: null,
    showComponentHints: false,
    sequentialQuestionMode: true,
  });
  
  const [timeRemaining, setTimeRemaining] = useState("");
  
  const [viewMode, setViewMode] = useState("single");
  
  const [submittingQuestions, setSubmittingQuestions] = useState({});
  const [submittingAll, setSubmittingAll] = useState(false);
  const [validationResults, setValidationResults] = useState({});
  const [attemptsUsed, setAttemptsUsed] = useState(() => {
    const saved = sessionStorage.getItem(`attemptsUsed_${sessionId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [submissionStatus, setSubmissionStatus] = useState(() => {
    const saved = sessionStorage.getItem(`submissionStatus_${sessionId}`);
    return saved ? JSON.parse(saved) : {};
  });

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
  
  const totalPossibleScore = calculateTotalPossibleScore(questions);
  const timeIsUp = sessionSettings.deadline && new Date() >= sessionSettings.deadline.toDate();

  useEffect(() => {
    sessionStorage.setItem(`attemptsUsed_${sessionId}`, JSON.stringify(attemptsUsed));
  }, [attemptsUsed, sessionId]);

  useEffect(() => {
    sessionStorage.setItem(`submissionStatus_${sessionId}`, JSON.stringify(submissionStatus));
  }, [submissionStatus, sessionId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseQuestionTimer();
      } else {
        const currentQuestionId = questions.find((q) => !questionScores[q.id])?.id;
        if (currentQuestionId) {
          resumeQuestionTimer(currentQuestionId);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [pauseQuestionTimer, resumeQuestionTimer, questions, questionScores]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const accessToken = sessionStorage.getItem(`formAccess_${sessionId}`);
        const respondentId = sessionStorage.getItem(`respondentId_${sessionId}`);
        if (!accessToken || !respondentId) {
          navigate(`/form-entrance/${sessionId}`);
          return;
        }

        const canProceed = await checkQuizStatus(sessionId, navigate);
        if (!canProceed) {
          return;
        }

        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (!sessionSnap.exists()) {
          throw new Error("Session not found");
        }
        
        const sessionData = sessionSnap.data();

        const leaderboardEnabled = sessionData.leaderboardEnabled || false;
        const deadline = sessionData.deadline || null;
        const showComponentHints = sessionData.showComponentHints || false;
        const sequentialQuestionMode = sessionData.sequentialQuestionMode !== undefined 
          ? sessionData.sequentialQuestionMode 
          : true;
        
        setSessionSettings({ 
          leaderboardEnabled, 
          deadline, 
          showComponentHints, 
          sequentialQuestionMode 
        });
        
        if (sequentialQuestionMode) {
          setViewMode("single");
        } else {
          setViewMode("all");
        }
        
        const { formId } = sessionData;
        sessionStorage.setItem(`formId_${sessionId}`, formId);
        
        if (sessionData.formSnapshot) {
          const processedSnapshot = {
            ...sessionData.formSnapshot,
            questions: sessionData.formSnapshot.questions.map((question) => ({
              ...question,
              components: question.components.map((comp) => {
                if (comp.type === "text") {
                  return {
                    ...comp,
                    text: {
                      text: comp.text?.text || comp.text || "",
                      format: {
                        ...(comp.text?.format || comp.format || {}),
                        bold: comp.text?.format?.bold ?? comp.format?.bold ?? false,
                        italic: comp.text?.format?.italic ?? comp.format?.italic ?? false,
                        align: comp.text?.format?.align ?? comp.format?.align ?? "left",
                        size: comp.text?.format?.size ?? comp.format?.size ?? "text-base",
                        color: comp.text?.format?.color ?? comp.format?.color ?? "text-gray-900",
                        font: comp.text?.format?.font ?? comp.format?.font ?? "Arial",
                      },
                    },
                  };
                }
                return comp;
              }),
            })).sort((a, b) => (a.order || 0) - (b.order || 0)),
          };
          setFormData({ id: formId, ...processedSnapshot });
          setQuestions(processedSnapshot.questions || []);
        } else {
          const [formSnap, questionsSnap] = await Promise.all([
            getDoc(doc(db, "forms", formId)),
            getDocs(collection(db, "forms", formId, "questions")),
          ]);

          if (!formSnap.exists()) throw new Error("Form not found");
          setFormData({ id: formId, ...formSnap.data() });

          if (!questionsSnap.empty) {
            const loaded = questionsSnap.docs
              .map((d) => ({
                id: parseInt(d.id, 10),
                ...d.data(),
                components: (d.data().components || []).map((comp) => {
                  if (comp.type === "text") {
                    return {
                      ...comp,
                      text: {
                        text: comp.text?.text || comp.text || "",
                        format: {
                          ...(comp.text?.format || comp.format || {}),
                          bold: comp.text?.format?.bold ?? comp.format?.bold ?? false,
                          italic: comp.text?.format?.italic ?? comp.format?.italic ?? false,
                          align: comp.text?.format?.align ?? comp.format?.align ?? "left",
                          size: comp.text?.format?.size ?? comp.format?.size ?? "text-base",
                          color: comp.text?.format?.color ?? comp.format?.color ?? "text-gray-900",
                          font: comp.text?.format?.font ?? comp.format?.font ?? "Arial",
                        },
                      },
                    };
                  }
                  return comp;
                }),
              }))
              .sort((a, b) => (a.order || 0) - (b.order || 0));
            setQuestions(loaded);
          }
        }

        const respondentSnap = await getDoc(doc(db, "respondents", respondentId));
        if (respondentSnap.exists()) {
          setRespondentData({ id: respondentId, ...respondentSnap.data() });
        } else {
          throw new Error("Respondent not found");
        }

        const responseDocId = sessionStorage.getItem(`responseId_${sessionId}`);
        if (responseDocId) {
          const docRef = doc(db, "responses", responseDocId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.questionScores) {
              setQuestionScores(data.questionScores);
            }
            if (typeof data.totalScore === "number") {
              setTotalScore(data.totalScore);
            }
          }
        }
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sessionId, navigate, setQuestionScores, setTotalScore]);

  const handleViewModeChange = (mode) => {
    if (sessionSettings.sequentialQuestionMode && mode === "all") {
      addToast('The instructor has set this quiz to question-by-question mode', 'info');
      return;
    }
    
    setViewMode(mode);
  };

  useEffect(() => {
    if (questions.length > 0) {
      const firstUnansweredQuestion = questions.find((q) => !questionScores[q.id]);
      if (firstUnansweredQuestion) {
        startQuestionTimer(firstUnansweredQuestion.id);
        setCurrentQuestionIndex(questions.findIndex(q => q.id === firstUnansweredQuestion.id));
      }
    }
  }, [questions, questionScores, startQuestionTimer]);

  useEffect(() => {
    if (sessionSettings.deadline) {
      const interval = setInterval(() => {
        const deadlineDate = sessionSettings.deadline.toDate();
        const diff = deadlineDate - new Date();
        if (diff <= 0) {
          setTimeRemaining("Time's up");
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionSettings.deadline]);

  const handleSubmitAll = async () => {
    if (timeIsUp) {
      addToast("Time is up! You can no longer submit the quiz.", "error");
      return;
    }
    try {
      setError("");
      setSubmittingAll(true);
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
      setSubmittingAll(false);
    }
  };

  const handleSubmitQuestion = async (questionId) => {
    if (timeIsUp) {
      addToast("Time is up! You can no longer submit answers.", "warning");
      return;
    }

    try {
      setSubmittingQuestions((prev) => ({ ...prev, [questionId]: true }));

      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      const used = attemptsUsed[questionId] || 0;
      const alreadyCorrect = !!questionScores[questionId];

      if (alreadyCorrect || used >= question.maxAttempts) {
        setSubmittingQuestions((prev) => ({ ...prev, [questionId]: false }));
        return;
      }

      const scorable = question.components.filter((c) => isScorableType(c.type));
      let allRequiredAnswered = true;
      let newVals = { ...(validationResults[questionId] || {}) };

      scorable.forEach((comp) => {
        if (isRequiredAndUnanswered(questionId, comp, answers)) {
          allRequiredAnswered = false;
          newVals[comp.id] = "not-submitted";
        }
      });

      if (!allRequiredAnswered) {
        addToast("Please answer all required parts first.", "warning");
        setValidationResults((prev) => ({ ...prev, [questionId]: newVals }));
        setSubmittingQuestions((prev) => ({ ...prev, [questionId]: false }));
        return;
      }

      let allCorrect = true;
      scorable.forEach((comp) => {
        const userAnswer = answers[questionId]?.[comp.id];
        const res = checkScorableCorrectness(comp, userAnswer);
        if (res === "correct") {
          newVals[comp.id] = "correct";
        } else if (res === "incorrect") {
          newVals[comp.id] = "incorrect";
          allCorrect = false;
        }
      });

      const newUsed = used + 1;
      const result = await submitQuestion(questionId, newUsed, newVals);

      if (result.success) {
        setValidationResults((prev) => ({ ...prev, [questionId]: newVals }));
        setAttemptsUsed((prev) => ({ ...prev, [questionId]: newUsed }));

        setSubmissionStatus((prev) => ({
          ...prev,
          [questionId]: {
            status: allCorrect ? "correct" : "incorrect",
            attempts: newUsed,
          },
        }));

        if (allCorrect) {
          const pts = question.points || 0;
          const updatedQScores = { ...questionScores, [questionId]: pts };
          setQuestionScores(updatedQScores);
          const newTotal = totalScore + pts;
          setTotalScore(newTotal);
          await saveScores(updatedQScores, newTotal, sessionId);
          addToast(`Great job! You earned ${pts} points!`, "success");
          
          const nextIndex = questions.findIndex((q, idx) => 
            idx > currentQuestionIndex && !updatedQScores[q.id]
          );
          
          if (nextIndex !== -1) {
            setCurrentQuestionIndex(nextIndex);
          }
        } else {
          const remainingAttempts = question.maxAttempts - newUsed;
          if (remainingAttempts > 0) {
            addToast(
              `Not quite right. You have ${remainingAttempts} attempt${
                remainingAttempts === 1 ? "" : "s"
              } remaining.`,
              "warning"
            );
          } else {
            addToast("No more attempts remaining for this question.", "error");
            
            const nextIndex = questions.findIndex((q, idx) => 
              idx > currentQuestionIndex && !questionScores[q.id]
            );
            
            if (nextIndex !== -1) {
              setCurrentQuestionIndex(nextIndex);
            }
          }
          await saveScores(questionScores, totalScore, sessionId);
        }
      }
    } catch (err) {
      addToast("An error occurred while submitting.", "error");
      console.error(err);
    } finally {
      setSubmittingQuestions((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-gray-600">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border-l-4 border-red-500">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-red-100 p-2 mr-3">
              <XCircle size={24} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Error</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
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
            formData={formData}
            respondentData={respondentData}
            timeRemaining={timeRemaining}
            isTimeUp={timeIsUp}
            totalScore={totalScore}
            totalPossible={totalPossibleScore}
            questions={questions}
            questionScores={questionScores}
            submissionStatus={submissionStatus}
          />
          
          <div className="mb-6">
            <div className="flex justify-center flex-col items-center">
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
                    <button
                      onClick={() => handleViewModeChange("single")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        viewMode === "single" 
                          ? "bg-indigo-100 text-indigo-800" 
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Question by Question
                    </button>
                    <button
                      onClick={() => handleViewModeChange("all")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        viewMode === "all" 
                          ? "bg-indigo-100 text-indigo-800" 
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Continuous View
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {viewMode === "single" ? (
            <>
              {questions.length > 0 && (
                <QuestionCard 
                  question={questions[currentQuestionIndex]}
                  index={currentQuestionIndex}
                  answers={answers}
                  updateAnswer={updateAnswer}
                  validationResults={validationResults}
                  attemptsUsed={attemptsUsed}
                  questionScores={questionScores}
                  submittingQuestions={submittingQuestions}
                  handleSubmitQuestion={handleSubmitQuestion}
                  sessionSettings={sessionSettings}
                  timeIsUp={timeIsUp}
                />
              )}
              
              <QuestionNavigation 
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                questionScores={questionScores}
                submissionStatus={submissionStatus}
                onNavigate={setCurrentQuestionIndex}
              />
            </>
          ) : (
            <div className="space-y-8">
              {questions.map((question, idx) => (
                <QuestionCard 
                  key={question.id}
                  question={question}
                  index={idx}
                  answers={answers}
                  updateAnswer={updateAnswer}
                  validationResults={validationResults}
                  attemptsUsed={attemptsUsed}
                  questionScores={questionScores}
                  submittingQuestions={submittingQuestions}
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
              disabled={submittingAll || timeIsUp}
              className={`group relative inline-flex items-center justify-center py-3 px-8 rounded-xl text-white text-lg font-bold transition-all ${
                submittingAll || timeIsUp
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {submittingAll ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
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
              You've completed {Object.keys(questionScores).length} of {questions.length} questions. 
              {Object.keys(questionScores).length < questions.length 
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
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {hookError}
                  </p>
                </div>
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