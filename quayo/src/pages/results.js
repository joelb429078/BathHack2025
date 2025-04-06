// src/pages/Results.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResultsData } from '../hooks/useResultsData';
import { AnimatedTabs, TabTrigger, TabContent } from '../components/Results/AnimatedTabs';
import StaticQuestionViewer from '../components/Results/StaticQuestionViewer';
import SessionSelector from '../components/Results/SessionSelector';
import LeaderboardTab from '../components/Results/LeaderboardTab';
import { getComponentDisplayInfo, formatTime, formatNumber } from '../components/Results/componentUtils';
import { db } from "../firebase";  
import { doc, getDoc } from "firebase/firestore";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Trophy, Clock, BarChart3, ChevronLeft, ChevronRight, Download, ArrowLeft, ChevronDown, ChevronUp, Menu, X
} from 'lucide-react';

// Responsive styles defined as a string
const responsiveStyles = `
  .dashboard-container { min-height: 100vh; background-color: #f9fafb; padding: 1rem; }
  @media (min-width: 640px) { .dashboard-container { padding: 1.5rem; } }
  @media (min-width: 768px) { .dashboard-container { padding: 2rem; } }
  .dashboard-header { margin-bottom: 1.5rem; }
  .metrics-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; margin-bottom: 1.5rem; }
  @media (min-width: 640px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; } }
  @media (min-width: 1024px) { .metrics-grid { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; } }
  .chart-container { height: 250px; }
  @media (min-width: 768px) { .chart-container { height: 300px; } }
`;
const ResponsiveStyles = () => <style>{responsiveStyles}</style>;

const ResultsDashboard = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('day');
  const [selectedRespondent, setSelectedRespondent] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [respondentNames, setRespondentNames] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  const { loading, error, formData, sessions, selectedSession, selectSession, responses, questions, metrics } = useResultsData(formId);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sortedQuestions = useMemo(() => {
    return questions ? [...questions].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  }, [questions]);

  // Derived metrics computed with useMemo
  const derivedMetrics = useMemo(() => {
    if (!responses || !sortedQuestions) return null;
    const questionDifficulty = sortedQuestions.map(q => {
      const attempts = responses.filter(r => r.attempts?.[q.id] || r.attempts?.[`${q.id}`]).length;
      const correct = responses.filter(r => r.questionScores?.[q.id] || r.questionScores?.[`${q.id}`]).length;
      return { questionId: q.id, difficulty: attempts ? (1 - (correct / attempts)) * 100 : 0 };
    });
    const timeDistribution = responses.reduce((acc, r) => {
      if (r.startTime) {
        const hour = new Date(r.startTime.toDate()).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {});
    const componentSuccess = {};
    sortedQuestions.forEach(q => {
      q.components.forEach(c => {
        if (!componentSuccess[c.type]) {
          componentSuccess[c.type] = { total: 0, correct: 0 };
        }
        responses.forEach(r => {
          const status = r.componentStatus?.[q.id]?.[c.id] || r.componentStatus?.[`${q.id}`]?.[c.id];
          if (status) {
            componentSuccess[c.type].total++;
            if (status === 'correct') componentSuccess[c.type].correct++;
          }
        });
      });
    });
    return { questionDifficulty, timeDistribution, componentSuccess };
  }, [responses, sortedQuestions]);

  const currentResponse = useMemo(() => {
    if (!selectedRespondent || !responses) return null;
    return responses.find(r => r.respondentId === selectedRespondent);
  }, [selectedRespondent, responses]);

  const toggleQuestion = (index) => {
    setExpandedQuestions(prev => ({ ...prev, [index]: !prev[index] }));
  };

  useEffect(() => {
    const fetchRespondentNames = async () => {
      if (!responses || responses.length === 0) return;
      const names = {};
      for (const response of responses) {
        if (response.respondentId) {
          const respondentDocRef = doc(db, 'respondents', response.respondentId);
          const respondentDocSnap = await getDoc(respondentDocRef);
          if (respondentDocSnap.exists()) {
            const data = respondentDocSnap.data();
            names[response.respondentId] = data.name || response.name || "Anonymous";
          }
        }
      }
      setRespondentNames(names);
    };
    fetchRespondentNames();
  }, [responses]);

  const handleExport = () => {
    if (!selectedSession) return;
    const exportData = { formData, sessionInfo: selectedSession, responses, metrics, derivedMetrics };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `results-${selectedSession.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ResponsiveStyles />
      <div className="dashboard-header flex items-center justify-between mb-8">
        <div>
          <button onClick={() => navigate(`/sessions/${formId}`)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Sessions</span>
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Results Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">Form: {formData?.formTitle || "Untitled Form"}</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Download className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Export Data</span>
        </button>
      </div>
      
      <SessionSelector sessions={sessions} selectedSessionId={selectedSession?.id} onSessionChange={selectSession} />
      
      {selectedSession ? (
        <AnimatedTabs defaultValue="overview">
          <TabTrigger value="overview">Overview</TabTrigger>
          <TabTrigger value="responses">Responses</TabTrigger>
          <TabTrigger value="leaderboard">Leaderboard</TabTrigger>
          <TabTrigger value="questions">Questions</TabTrigger>
          <TabTrigger value="analytics">Analytics</TabTrigger>
          
          <TabContent value="overview">
            {/* Overview tab with charts and metrics */}
            <div className="metrics-grid">
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <h3>Total Respondents</h3>
                <p>{metrics.totalRespondents}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <h3>Total Points</h3>
                <p>{formatNumber(metrics.totalPoints)}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <h3>Avg. Time per Quiz</h3>
                <p>{formatTime(metrics.avgTime)}</p>
              </div>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                <h3>Questions</h3>
                <p>{sortedQuestions.length}</p>
              </div>
            </div>
            <div className="chart-container mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={Object.entries(derivedMetrics?.timeDistribution || {}).map(([hour, count]) => ({ hour: `${hour}:00`, count }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabContent>
          
          <TabContent value="leaderboard">
            <LeaderboardTab responses={responses} respondentNames={respondentNames} questions={sortedQuestions} />
          </TabContent>
          
          <TabContent value="responses">
            {/* Respondent selector and question viewer */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <select value={selectedRespondent || ''} onChange={(e) => setSelectedRespondent(e.target.value)} className="w-full border rounded-lg p-2">
                <option value="">Select a respondent</option>
                {responses.map(r => (
                  <option key={r.respondentId} value={r.respondentId}>
                    {respondentNames[r.respondentId] || "Anonymous"} - Score: {formatNumber(r.totalScore || 0)}
                  </option>
                ))}
              </select>
            </div>
            {selectedRespondent && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))} disabled={activeQuestionIndex === 0}>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3>Question {activeQuestionIndex + 1} of {sortedQuestions.length}</h3>
                  <button onClick={() => setActiveQuestionIndex(prev => Math.min(sortedQuestions.length - 1, prev + 1))} disabled={activeQuestionIndex === sortedQuestions.length - 1}>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <StaticQuestionViewer question={sortedQuestions[activeQuestionIndex]} response={currentResponse} />
                </div>
              </div>
            )}
          </TabContent>
          
          <TabContent value="analytics">
            <div className="mt-6">
              {/* Analytics charts */}
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derivedMetrics?.questionDifficulty || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="questionId" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="difficulty" fill="#ef4444" name="Difficulty %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabContent>
        </AnimatedTabs>
      ) : (
        <div className="text-center text-gray-500 py-8">Select a session to view results</div>
      )}
    </div>
  );
};

export default ResultsDashboard;
