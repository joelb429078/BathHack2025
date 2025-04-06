import React, { useState, useMemo, useEffect } from 'react';
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
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users,
  Trophy,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from 'lucide-react';

// Add responsive styles
const responsiveStyles = `
  /* Base dashboard styles */
  .dashboard-container {
    min-height: 100vh;
    background-color: #f9fafb;
    padding: 1rem;
  }
  
  @media (min-width: 640px) {
    .dashboard-container {
      padding: 1.5rem;
    }
  }
  
  @media (min-width: 768px) {
    .dashboard-container {
      padding: 2rem;
    }
  }
  
  /* Header responsiveness */
  .dashboard-header {
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 639px) {
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .dashboard-header button {
      width: 100%;
      justify-content: center;
    }
  }
  
  /* Metrics grid responsiveness */
  .metrics-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 640px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
  }
  
  @media (min-width: 1024px) {
    .metrics-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
  }
  
  /* Chart container responsiveness */
  .chart-container {
    height: 250px;
  }
  
  @media (min-width: 768px) {
    .chart-container {
      height: 300px;
    }
  }
  
  /* Question navigation responsiveness */
  .question-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 639px) {
    .question-title {
      font-size: 0.875rem;
    }
  }
  
  /* Component grid responsiveness */
  .component-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (min-width: 640px) {
    .component-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .component-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  @media (min-width: 1280px) {
    .component-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  /* Question stats responsiveness */
  .question-stats {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-top: 1rem;
  }
  
  @media (min-width: 640px) {
    .question-stats {
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
  }
`;

// Responsive styles component
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

  const { 
    loading, 
    error, 
    formData, 
    sessions,
    selectedSession,
    selectSession,
    responses, 
    questions, 
    metrics 
  } = useResultsData(formId);

  // Handle mobile tab menu visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure questions are sorted by order
  const sortedQuestions = useMemo(() => {
    if (!questions) return [];
    return [...questions].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [questions]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!responses || !sortedQuestions) return null;

    // Calculate question difficulty
    const questionDifficulty = sortedQuestions.map(q => {
      const attempts = responses.filter(r => {
        // Check both formats for attempts
        return r.attempts?.[q.id] || r.attempts?.[`${q.id}`];
      }).length;
      
      const correctAnswers = responses.filter(r => {
        // Check both formats for scores
        return r.questionScores?.[q.id] || r.questionScores?.[`${q.id}`];
      }).length;
      
      return {
        questionId: q.id,
        difficulty: attempts ? (1 - (correctAnswers / attempts)) * 100 : 0,
        avgAttempts: attempts ? responses.reduce((sum, r) => {
          // Check both formats for attempts
          const attemptsForQuestion = r.attempts?.[q.id] || r.attempts?.[`${q.id}`] || 0;
          return sum + attemptsForQuestion;
        }, 0) / attempts : 0
      };
    });

    // Calculate response times distribution
    const timeDistribution = responses.reduce((acc, r) => {
      if (!r.startTime) return acc;
      const hour = new Date(r.startTime.toDate()).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Success rate per component type
    const componentSuccess = {};
    sortedQuestions.forEach(q => {
      q.components.forEach(c => {
        if (!componentSuccess[c.type]) {
          componentSuccess[c.type] = { total: 0, correct: 0 };
        }
        responses.forEach(r => {
          // Check both formats for componentStatus
          const componentStatus = 
            r.componentStatus?.[q.id]?.[c.id] || 
            r.componentStatus?.[`${q.id}`]?.[c.id];
            
          if (componentStatus) {
            componentSuccess[c.type].total++;
            if (componentStatus === 'correct') {
              componentSuccess[c.type].correct++;
            }
          }
        });
      });
    });

    return {
      questionDifficulty,
      timeDistribution,
      componentSuccess
    };
  }, [responses, sortedQuestions]);

  // Get current respondent's response with proper data normalization
  const currentResponse = useMemo(() => {
    if (!selectedRespondent || !responses) return null;
    const response = responses.find(r => r.respondentId === selectedRespondent);
    if (!response) return null;
    return response;
  }, [selectedRespondent, responses]);

  // For debugging
  useEffect(() => {
    if (currentResponse) {
      console.log("RESPONSE DEBUG - Full current response:", currentResponse);
      console.log("RESPONSE DEBUG - Attempts format:", currentResponse.attempts);
      
      if (sortedQuestions && sortedQuestions.length > 0) {
        const questionId = sortedQuestions[activeQuestionIndex]?.id;
        console.log(
          `RESPONSE DEBUG - Attempts for question ${questionId}:`, 
          currentResponse.attempts?.[questionId],
          currentResponse.attempts?.[`${questionId}`]
        );
        
        console.log(
          `RESPONSE DEBUG - Answers for question ${questionId}:`, 
          currentResponse.answers?.[questionId],
          currentResponse.answers?.[`${questionId}`]
        );
        
        console.log(
          `RESPONSE DEBUG - Component status for question ${questionId}:`, 
          currentResponse.componentStatus?.[questionId],
          currentResponse.componentStatus?.[`${questionId}`]
        );
      }
    }
  }, [currentResponse, activeQuestionIndex, sortedQuestions]);

  // Enhanced getAttemptsForQuestion
  const getAttemptsForQuestion = (questionId) => {
    if (!currentResponse) return 0;
    
    // Try multiple formats for accessing attempts
    let attempts = 0;
    
    // First check direct flattened format (this is what you have in your data)
    if (typeof currentResponse[`attempts.${questionId}`] === 'number') {
      attempts = currentResponse[`attempts.${questionId}`];
    }
    // Then try nested format (as a fallback)
    else if (currentResponse?.attempts && typeof currentResponse.attempts[questionId] === 'number') {
      attempts = currentResponse.attempts[questionId];
    }
    // Then try string key in nested format (as a fallback)
    else if (currentResponse?.attempts && typeof currentResponse.attempts[`${questionId}`] === 'number') {
      attempts = currentResponse.attempts[`${questionId}`];
    }
    // Last resort - search all keys for a matching one with attempts prefix
    else {
      const attemptKeys = Object.keys(currentResponse || {})
        .filter(key => key.startsWith('attempts.'));
      
      const matchingKey = attemptKeys.find(key => {
        const keyParts = key.split('.');
        return keyParts.length === 2 && keyParts[1] === String(questionId);
      });
      
      if (matchingKey) {
        attempts = currentResponse[matchingKey];
      }
    }
    
    return attempts || 0;
  };

  // Enhanced getScoreForQuestion
  const getScoreForQuestion = (questionId) => {
    if (!currentResponse) return 0;
    
    console.log(`Getting score for question ${questionId}`, {
      directAccess: currentResponse.questionScores?.[questionId],
      stringAccess: currentResponse.questionScores?.[`${questionId}`]
    });
    
    // Try multiple formats for accessing scores
    let score = 0;
    
    if (currentResponse?.questionScores) {
      // Direct numeric access
      if (typeof currentResponse.questionScores[questionId] === 'number') {
        score = currentResponse.questionScores[questionId];
      }
      // String key access
      else if (typeof currentResponse.questionScores[`${questionId}`] === 'number') {
        score = currentResponse.questionScores[`${questionId}`];
      }
      // Search for matching key
      else {
        const matchingKey = Object.keys(currentResponse.questionScores)
          .find(key => String(key) === String(questionId));
        
        if (matchingKey) {
          score = currentResponse.questionScores[matchingKey];
        }
      }
    }
    
    return score || 0;
  };

  // Enhanced getTimeForQuestion
  const getTimeForQuestion = (questionId) => {
    if (!currentResponse) return 0;
    
    console.log(`Getting time for question ${questionId}`, {
      directAccess: currentResponse.questionTimes?.[questionId],
      stringAccess: currentResponse.questionTimes?.[`${questionId}`]
    });
    
    // Try multiple formats for accessing time
    let time = 0;
    
    if (currentResponse?.questionTimes) {
      // Direct numeric access
      if (typeof currentResponse.questionTimes[questionId] === 'number') {
        time = currentResponse.questionTimes[questionId];
      }
      // String key access
      else if (typeof currentResponse.questionTimes[`${questionId}`] === 'number') {
        time = currentResponse.questionTimes[`${questionId}`];
      }
      // Search for matching key
      else {
        const matchingKey = Object.keys(currentResponse.questionTimes)
          .find(key => String(key) === String(questionId));
        
        if (matchingKey) {
          time = currentResponse.questionTimes[matchingKey];
        }
      }
    }
    
    return time || 0;
  };

  // Toggle question expansion
  const toggleQuestion = (index) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    const fetchRespondentNames = async () => {
      if (!responses || responses.length === 0) return;
      
      try {
        const names = {};
        for (const response of responses) {
          if (response.respondentId) {
            // Using Firestore doc fetching
            const respondentDocRef = doc(db, 'respondents', response.respondentId);
            const respondentDocSnap = await getDoc(respondentDocRef);
            if (respondentDocSnap.exists()) {
              const data = respondentDocSnap.data();
              names[response.respondentId] = data.name || response.name || "Anonymous";
            }
          }
        }
        setRespondentNames(names);
      } catch (error) {
        console.error('Error fetching respondent names:', error);
      }
    };
    
    fetchRespondentNames();
  }, [responses]);

  // Handle data export
  const handleExport = () => {
    if (!selectedSession) return;
    
    const exportData = {
      formInfo: formData,
      sessionInfo: selectedSession,
      responses: responses,
      metrics: metrics,
      derivedMetrics: derivedMetrics
    };
    
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

  // Toggle mobile menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ResponsiveStyles />
      
      {/* Header Section */}
      <div className="dashboard-header flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate(`/sessions/${formId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Sessions</span>
            <span className="sm:hidden">Back</span>
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Results Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Form: {formData?.formTitle || "Untitled Form"}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 md:gap-2 px-2 py-1 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base"
          disabled={!selectedSession}
        >
          <Download className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">Export Data</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Session Selector */}
      <SessionSelector
        sessions={sessions}
        selectedSessionId={selectedSession?.id}
        onSessionChange={selectSession}
      />

      {selectedSession ? (
        <>
          {/* Metrics Grid */}
          <div className="metrics-grid">
            <MetricCard
              icon={<Users className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />}
              title="Total Respondents"
              value={metrics.totalRespondents}
              subtext={`${metrics.activeRespondents} currently active`}
            />
            <MetricCard
              icon={<Trophy className="h-5 w-5 md:h-6 md:w-6 text-green-500" />}
              title="Total Points"
              value={formatNumber(metrics.totalPoints)}
              subtext={`${metrics.completionRate}% completion rate`}
            />
            <MetricCard
              icon={<Clock className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />}
              title="Avg. Time per Quiz"
              value={formatTime(
                responses.reduce((sum, r) => sum + (r.totalTimeSpent || 0), 0) / (responses.length || 1)
              )}
              subtext="From start to submission"
            />
            <MetricCard
              icon={<BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />}
              title="Questions"
              value={sortedQuestions.length}
              subtext={`${Object.keys(derivedMetrics?.componentSuccess || {}).length} component types`}
            />
          </div>

          {/* Mobile Menu Toggle - Only visible on small screens */}
          <div className="md:hidden mb-4">
            <button
              onClick={toggleMenu}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white"
            >
              <span className="font-medium text-gray-700">Menu</span>
              {menuOpen ? (
                <X className="w-5 h-5 text-gray-500" />
              ) : (
                <Menu className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Main Content */}
          <AnimatedTabs defaultValue="overview">
            <TabTrigger value="overview">Overview</TabTrigger>
            <TabTrigger value="responses">Responses</TabTrigger>
            <TabTrigger value="leaderboard">Leaderboard</TabTrigger>
            <TabTrigger value="questions">Questions</TabTrigger>
            <TabTrigger value="analytics">Analytics</TabTrigger>
            
            {/* Overview Tab */}
            <TabContent value="overview">
              <div className="space-y-6">
                {/* Response Time Distribution */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Response Time Distribution</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={Object.entries(derivedMetrics?.timeDistribution || {}).map(([hour, count]) => ({
                          hour: `${hour}:00`,
                          count
                        }))}
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
                </div>

                {/* Question Difficulty Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Question Difficulty</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={derivedMetrics?.questionDifficulty || []}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="questionId" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="difficulty" fill="#ef4444" name="Difficulty %" />
                        <Bar dataKey="avgAttempts" fill="#3b82f6" name="Avg Attempts" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Component Success Rates */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Component Success Rates</h3>
                  <div className="component-grid">
                    {Object.entries(derivedMetrics?.componentSuccess || {}).map(([type, data]) => {
                      const { name, icon: Icon, color } = getComponentDisplayInfo(type);
                      const successRate = data.total ? Math.round((data.correct / data.total) * 100) : 0;
                      
                      // Hide zero-usage components
                      if (successRate === 0 && data.total === 0) return null;

                      return (
                        <div key={type} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`h-4 h-4 sm:h-5 sm:w-5 ${color}`} />
                            <h4 className="font-medium text-sm sm:text-base text-gray-700">{name}</h4>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">
                            {successRate}%
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {data.correct}/{data.total} correct
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabContent>
            
            {/* Leaderboard Tab */}
            <TabContent value="leaderboard">
              <LeaderboardTab 
                responses={responses}
                respondentNames={respondentNames}
                questions={sortedQuestions}
              />
            </TabContent>

            {/* Responses Tab */}
            <TabContent value="responses">
              <div className="space-y-6">
                {/* Respondent Selector */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex gap-4">
                    <select
                      value={selectedRespondent || ''}
                      onChange={(e) => setSelectedRespondent(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 
                              text-gray-700 leading-tight focus:outline-none focus:border-blue-500
                              focus:ring focus:ring-blue-200 cursor-pointer"
                    >
                      <option value="">Select a respondent</option>
                      {responses.map(r => (
                        <option key={r.respondentId} value={r.respondentId}>
                          {respondentNames[r.respondentId] || r.name || "Anonymous"} - Score: {formatNumber(r.totalScore || 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Question Navigator */}
                {selectedRespondent && (
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <div className="question-navigation mb-4">
                      <button
                        onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={activeQuestionIndex === 0}
                        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="question-title font-semibold">
                        Question {activeQuestionIndex + 1} of {sortedQuestions.length}
                      </h3>
                      <button
                        onClick={() => setActiveQuestionIndex(prev => Math.min(sortedQuestions.length - 1, prev + 1))}
                        disabled={activeQuestionIndex === sortedQuestions.length - 1}
                        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Question Preview Container */}
                    <div className="flex justify-center">
                      <div className="w-full max-w-4xl">
                        <StaticQuestionViewer
                          question={sortedQuestions[activeQuestionIndex]}
                          response={currentResponse}
                        />
                      </div>
                    </div>

                    {/* Question Stats */}
                    <div className="question-stats">
                      <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-700 text-sm sm:text-base">Attempts Used</h4>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900">
                          {getAttemptsForQuestion(sortedQuestions[activeQuestionIndex]?.id)}/
                          {sortedQuestions[activeQuestionIndex]?.maxAttempts || 1}
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-700 text-sm sm:text-base">Points Earned</h4>
                        <p className="text-xl sm:text-2xl font-bold text-green-900">
                          {getScoreForQuestion(sortedQuestions[activeQuestionIndex]?.id)}/
                          {sortedQuestions[activeQuestionIndex]?.points || 0}
                        </p>
                      </div>
                      <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-700 text-sm sm:text-base">Time Taken</h4>
                        <p className="text-xl sm:text-2xl font-bold text-purple-900">
                          {formatTime(getTimeForQuestion(sortedQuestions[activeQuestionIndex]?.id))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabContent>

            {/* Questions Tab */}
            <TabContent value="questions">
              <div className="space-y-4">
                {sortedQuestions.map((question, index) => (
                  <div key={index} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                    <div className="cursor-pointer" onClick={() => toggleQuestion(index)}>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-semibold">Question {index + 1}</h3>
                          {expandedQuestions[index] ? 
                            <ChevronUp className="h-5 w-5 text-gray-500" /> :
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          }
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                          <span className="text-blue-600">
                            Points: {formatNumber(
                              responses.reduce((sum, r) => {
                                // Check both possible formats for scores
                                const score = r.questionScores?.[question.id] || 
                                              r.questionScores?.[`${question.id}`] || 0;
                                return sum + score;
                              }, 0)
                            )}
                          </span>
                          <span className="text-green-600">
                            Success Rate: {formatNumber(
                              Math.round(
                                (responses.filter(r => {
                                  // Check both possible formats
                                  return r.questionScores?.[question.id] || 
                                         r.questionScores?.[`${question.id}`];
                                }).length / (responses.length || 1)) * 100
                              ),
                              '0'
                            )}%
                          </span>
                        </div>
                      </div>

                      {/* Component Icons */}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {question.components.map((comp, compIndex) => {
                          const { icon: Icon, color, name } = getComponentDisplayInfo(comp.type);
                          return (
                            <div 
                              key={compIndex}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md"
                              title={name}
                            >
                              <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${color}`} />
                              <span className="text-xs text-gray-600">{name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedQuestions[index] && (
                      <div className="mt-6 space-y-4 transition-all duration-300">
                        {/* Component Distribution */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Time Analysis</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Avg. Time Spent</span>
                                <span className="font-medium">
                                  {formatTime(
                                    responses.reduce((sum, r) => {
                                      // Check both possible formats for times
                                      const time = r.questionTimes?.[question.id] || 
                                                   r.questionTimes?.[`${question.id}`] || 0;
                                      return sum + time;
                                    }, 0) / (responses.length || 1)
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Fastest Response</span>
                                <span className="font-medium">
                                  {(() => {
                                    const fastest = Math.min(
                                      ...responses.map(r => {
                                        const time = r.questionTimes?.[question.id] ||
                                                    r.questionTimes?.[`${question.id}`] ||
                                                    Infinity;
                                        return time === 0 ? Infinity : time; // skip zero times
                                      })
                                    );
                                    return fastest === Infinity ? '--' : formatTime(fastest);
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Component Success Rates */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">Component Performance</h4>
                            <div className="space-y-2 text-sm">
                              {question.components.map((comp, compIndex) => {
                                const { name } = getComponentDisplayInfo(comp.type);
                                const correctCount = responses.filter(r => {
                                  const status = r.componentStatus?.[question.id]?.[comp.id] || 
                                                r.componentStatus?.[`${question.id}`]?.[comp.id];
                                  return status === 'correct';
                                }).length;
                                const totalAttempts = responses.filter(r => {
                                  const status = r.componentStatus?.[question.id]?.[comp.id] || 
                                                r.componentStatus?.[`${question.id}`]?.[comp.id];
                                  return !!status;
                                }).length;

                                if (totalAttempts === 0) return null;

                                return (
                                  <div key={compIndex} className="flex justify-between items-center">
                                    <span className="text-gray-600">{name}</span>
                                    <span className="font-medium">
                                      {formatNumber(
                                        Math.round((correctCount / totalAttempts) * 100),
                                        '0'
                                      )}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Question Preview */}
                        <div className="flex justify-center">
                          <div className="w-full max-w-4xl">
                            <StaticQuestionViewer
                              question={question}
                              response={null}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabContent>

            {/* Analytics Tab */}
            <TabContent value="analytics">
              <div className="space-y-6">
                {/* Time-based Analysis */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Response Patterns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 
                              text-gray-700 leading-tight focus:outline-none focus:border-blue-500"
                    >
                      <option value="hour">Past Hour</option>
                      <option value="day">Past 24 Hours</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                    </select>
                  </div>
                  <div className="chart-container mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={responses.map(r => ({
                          time: r.startTime ? new Date(r.startTime.toDate()).toLocaleString() : 'Unknown',
                          score: r.totalScore || 0
                        }))}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#3b82f6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Component Performance Analysis */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Component Performance</h3>
                  <div className="component-grid">
                    {Object.entries(derivedMetrics?.componentSuccess || {}).map(([type, data]) => {
                      const { name, icon: Icon, color } = getComponentDisplayInfo(type);
                      const successRate = data.total ? Math.round((data.correct / data.total) * 100) : 0;
                      
                      if (successRate === 0 && data.total === 0) return null;

                      return (
                        <div key={type} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
                            <h4 className="font-medium text-gray-700 text-sm sm:text-base">{name}</h4>
                          </div>
                          <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-2">
                            {successRate}%
                          </p>
                          <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </TabContent>
          </AnimatedTabs>
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Select a session to view results
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, title, value, subtext }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-gray-500 text-xs sm:text-sm font-medium">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{value}</p>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">{subtext}</p>
      </div>
      <div className="bg-gray-50 p-2 sm:p-3 rounded-full">{icon}</div>
    </div>
  </div>
);

export default ResultsDashboard;