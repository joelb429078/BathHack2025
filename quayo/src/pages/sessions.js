// src/pages/Sessions.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  collection,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import {
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  ChartBar,
  Calendar,
  Clock,
  Users,
  Eye,
  Link as LinkIcon,
  Award,
  RefreshCw,
  Layers,
  Settings,
  QrCode
} from "lucide-react";
import { useToast } from "../components/Toast";
import QRCode from "react-qr-code";

const SessionCard = ({ session, isActive, onClick, onDelete, responseCount }) => {
  const deadlineText = session.deadline
    ? new Date(session.deadline.toDate()).toLocaleString()
    : "No deadline";
  const dateCreated = new Date(session.createdAt.toDate());
  const formattedDate = dateCreated.toLocaleDateString();
  const formattedTime = dateCreated.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return (
    <div
      className={`p-6 rounded-lg border shadow-sm transition-all duration-300 cursor-pointer ${
        isActive
          ? "border-blue-500 bg-blue-50 scale-102 shadow-md"
          : "border-gray-200 hover:border-blue-300 hover:shadow bg-white"
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="w-full">
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Calendar size={14} className="mr-1" />
            <span>{formattedDate}</span>
            <Clock size={14} className="ml-3 mr-1" />
            <span>{formattedTime}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-800 font-medium truncate">
              Session ID: {session.sessionId.split('-').pop()}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.sessionId);
              }}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
              aria-label="Delete session"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex items-center text-xs text-gray-600">
              <Award size={14} className="mr-2" />
              <span>Leaderboard:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                session.leaderboardEnabled 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {session.leaderboardEnabled ? "On" : "Off"}
              </span>
            </div>
            {session.deadline && (
              <div className="flex items-center text-xs text-gray-600">
                <Clock size={14} className="mr-2" />
                <span>Deadline: {deadlineText}</span>
              </div>
            )}
            <div className="flex items-center text-xs text-gray-600">
              <Eye size={14} className="mr-2" />
              <span>Component Hints:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                session.showComponentHints 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {session.showComponentHints ? "On" : "Off"}
              </span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Layers size={14} className="mr-2" />
              <span>Sequential Mode:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                session.sequentialQuestionMode
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {session.sequentialQuestionMode ? "On" : "Off"}
              </span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Users size={14} className="mr-2" />
              <span>Responses:</span>
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                {responseCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sessions = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState("");

  // Load sessions once when component mounts
  useEffect(() => {
    const loadSessions = async () => {
      if (!formId) return;
      try {
        setLoading(true);
        const sessionsRef = collection(db, "sessions");
        const querySnapshot = await getDocs(sessionsRef);
        const loadedSessions = querySnapshot.docs
          .filter((doc) => {
            const docMatches = doc.id.startsWith(formId);
            const formIdMatches = doc.data().formId === formId;
            return docMatches || formIdMatches;
          })
          .map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }))
          .sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
        setSessions(loadedSessions);
        if (loadedSessions.length > 0) {
          setActiveSession(loadedSessions[0]);
          if (loadedSessions[0].deadline) {
            const isoStr = new Date(loadedSessions[0].deadline.toDate()).toISOString();
            setDeadlineInput(isoStr.slice(0, 16));
          }
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, [formId]);

  const createSession = async () => {
    try {
      const sessionsRef = collection(db, "sessions");
      const querySnapshot = await getDocs(sessionsRef);
      const currentSessions = querySnapshot.docs.filter((doc) => {
        const docMatches = doc.id.startsWith(formId);
        const formIdMatches = doc.data().formId === formId;
        return docMatches || formIdMatches;
      });
      const SESSION_LIMIT = 5;
      if (currentSessions.length >= SESSION_LIMIT) {
        addToast(`Maximum of ${SESSION_LIMIT} sessions reached for this form!`, "warning");
        return;
      }
      const uniqueSessionId = `${formId}-${Date.now()}`;
      const sessionDocRef = doc(db, "sessions", uniqueSessionId);
      const formDocRef = doc(db, "forms", formId);
      const formSnap = await getDoc(formDocRef);
      if (!formSnap.exists()) throw new Error("Form not found");
      const formDataSnapshot = formSnap.data();
      const questionsSnap = await getDocs(collection(db, "forms", formId, "questions"));
      let loadedQuestions = [];
      if (!questionsSnap.empty) {
        loadedQuestions = questionsSnap.docs
          .map((docSnap) => ({
            id: parseInt(docSnap.id, 10),
            ...docSnap.data(),
          }))
          .sort((a, b) => a.id - b.id);
      }
      formDataSnapshot.questions = loadedQuestions;
      const sessionData = {
        formId,
        sessionId: uniqueSessionId,
        sessionLink: `/quiz/${uniqueSessionId}`,
        createdAt: Timestamp.now(),
        leaderboardEnabled: false,
        deadline: null,
        showComponentHints: false,
        sequentialQuestionMode: true,
        formSnapshot: formDataSnapshot,
      };
      await setDoc(sessionDocRef, sessionData);
      setSessions((prev) => [{ ...sessionData, id: uniqueSessionId }, ...prev]);
      setActiveSession({ ...sessionData, id: uniqueSessionId });
      setDeadlineInput("");
      addToast("Session created successfully", "success");
    } catch (error) {
      console.error("Error creating session:", error);
      addToast("Failed to create session", "error");
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await deleteDoc(doc(db, "sessions", sessionId));
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (activeSession?.sessionId === sessionId) {
        setActiveSession(sessions[0] || null);
      }
      addToast("Session deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting session:", error);
      addToast("Failed to delete session", "error");
    }
  };

  const copyLink = async () => {
    if (!activeSession) return;
    const fullUrl = `${window.location.origin}/quiz/${activeSession.sessionId}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const goToQuiz = () => {
    if (!activeSession) return;
    navigate(`/quiz/${activeSession.sessionId}`);
  };

  const goToResults = () => {
    if (!activeSession) return;
    navigate(`/results/${formId}`);
  };

  const goBackToCreation = () => {
    navigate(`/forms/${formId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Header with navigation buttons */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between mb-8">
          <button
            onClick={goBackToCreation}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-lg shadow-sm hover:shadow hover:bg-gray-50 transition-all duration-300"
          >
            <ArrowLeft size={18} />
            <span>Back to Creation</span>
          </button>
          <button
            onClick={goToResults}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 transform"
          >
            <ChartBar size={18} />
            <span>View Results</span>
          </button>
        </div>
        {/* Active session and creation UI */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Management</h1>
              <div className="flex items-center">
                <p className="text-gray-600">Form ID: </p>
                <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">{formId}</span>
              </div>
            </div>
            <button
              onClick={createSession}
              className="flex items-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm hover:shadow transition-all duration-300"
            >
              <Plus size={20} />
              <span>Create New Session</span>
            </button>
          </div>
          {activeSession ? (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-5 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <h2 className="font-medium text-gray-800">Active Session</h2>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(activeSession.createdAt.toDate()).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center mt-1">
                  <LinkIcon size={14} className="mr-1 text-gray-500" />
                  <p className="text-sm font-mono text-gray-700">
                    {activeSession.sessionId}
                  </p>
                </div>
              </div>
              {/* Share Quiz UI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <LinkIcon size={16} className="mr-2" />
                    <span>Share Your Quiz</span>
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={copyLink}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      <span>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>
                    <button
                      onClick={goToQuiz}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
                    >
                      <ExternalLink size={18} />
                      <span>Go to Quiz</span>
                    </button>
                  </div>
                </div>
                {/* Update Session UI */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <RefreshCw size={16} className="mr-2" />
                    <span>Update Session</span>
                  </h3>
                  <button
                    onClick={() => {}}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                  >
                    <RefreshCw size={18} />
                    <span>Update with Latest Changes</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No active session selected</p>
              <p className="text-sm text-gray-400 mt-2">
                Create a new session or select one from below
              </p>
            </div>
          )}
        </div>
        {/* Sessions List */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-6">
            <Users size={20} className="mr-2" />
            <span>All Sessions ({sessions.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.sessionId}
                session={session}
                isActive={activeSession?.sessionId === session.sessionId}
                onClick={() => setActiveSession(session)}
                onDelete={deleteSession}
                responseCount={0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sessions;
