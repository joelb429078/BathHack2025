import React, { useState, useMemo } from 'react';
import { 
  Trophy,
  Clock,
  ArrowUp,
  ArrowDown,
  Medal,
  Search,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { formatTime, formatNumber } from './componentUtils';

const LeaderboardTab = ({ responses, respondentNames, questions }) => {
  const [sortField, setSortField] = useState('totalScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  
  // Calculate total possible score
  const totalPossibleScore = useMemo(() => {
    if (!questions || !questions.length) return 0;
    return questions.reduce((sum, q) => sum + (q.points || 0), 0);
  }, [questions]);
  
  // Processed and sorted data
  const leaderboardData = useMemo(() => {
    if (!responses) return [];
    
    const data = responses.map((response, index) => {
      const respondentName = respondentNames[response.respondentId] || response.name || `Participant ${index + 1}`;
      const totalScore = response.totalScore || 0;
      const scorePercentage = totalPossibleScore ? (totalScore / totalPossibleScore) * 100 : 0;
      const completionTime = response.totalTimeSpent || 0;
      const completedAt = response.completedAt?.toDate() || null;
      const status = response.status || 'incomplete';
      const questionsAnswered = Object.keys(response.questionScores || {}).length;
      const questionsCorrect = Object.values(response.questionScores || {}).filter(score => score > 0).length;
      
      // Calculate average time per question
      const avgTimePerQuestion = questionsAnswered ? completionTime / questionsAnswered : 0;
      
      // Determine efficiency score (higher score with less time gets better efficiency)
      const efficiencyScore = completionTime ? (totalScore / completionTime) * 10000 : 0;
      
      return {
        id: response.respondentId,
        name: respondentName,
        totalScore,
        scorePercentage,
        completionTime,
        completedAt,
        status,
        questionsAnswered,
        questionsCorrect,
        questionAccuracy: questionsAnswered ? (questionsCorrect / questionsAnswered) * 100 : 0,
        avgTimePerQuestion,
        efficiencyScore,
        startTime: response.startTime?.toDate() || null
      };
    });
    
    // Filter by search query
    const filtered = data.filter(item => {
      if (!searchQuery.trim()) return true;
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    // Sort data
    return filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle dates
      if (sortField === 'completedAt' || sortField === 'startTime') {
        aValue = aValue ? aValue.getTime() : 0;
        bValue = bValue ? bValue.getTime() : 0;
      }
      
      // Handle null values
      if (aValue === null) aValue = sortField === 'completionTime' ? Infinity : 0;
      if (bValue === null) bValue = sortField === 'completionTime' ? Infinity : 0;
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [responses, respondentNames, sortField, sortDirection, searchQuery, totalPossibleScore]);
  
  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new fields
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };
  
  // Format date
  const formatDate = (date) => {
    if (!date) return '--';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Get medal component based on rank
  const getMedal = (index) => {
    if (index === 0) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-gray-500 font-bold ml-1">{index + 1}</span>;
  };
  
  // Get background color based on rank
  const getRowBackground = (index) => {
    if (index === 0) return 'bg-yellow-50';
    if (index === 1) return 'bg-gray-50';
    if (index === 2) return 'bg-amber-50';
    return index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-500" />
            Leaderboard
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={() => setShowAdvancedStats(!showAdvancedStats)}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              {showAdvancedStats ? 'Basic View' : 'Advanced View'}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="py-3 pr-3 w-16 sm:w-20">Rank</th>
                <th className="py-3 px-3">
                  <button 
                    className="flex items-center gap-1 hover:text-gray-700" 
                    onClick={() => handleSort('name')}
                  >
                    Participant {getSortIndicator('name')}
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button 
                    className="flex items-center gap-1 hover:text-gray-700" 
                    onClick={() => handleSort('totalScore')}
                  >
                    Score {getSortIndicator('totalScore')}
                  </button>
                </th>
                <th className="py-3 px-3 hidden sm:table-cell">
                  <button 
                    className="flex items-center gap-1 hover:text-gray-700" 
                    onClick={() => handleSort('completionTime')}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Time {getSortIndicator('completionTime')}
                  </button>
                </th>
                {showAdvancedStats && (
                  <>
                    <th className="py-3 px-3 hidden md:table-cell">
                      <button 
                        className="flex items-center gap-1 hover:text-gray-700" 
                        onClick={() => handleSort('questionAccuracy')}
                      >
                        Accuracy {getSortIndicator('questionAccuracy')}
                      </button>
                    </th>
                    <th className="py-3 px-3 hidden lg:table-cell">
                      <button 
                        className="flex items-center gap-1 hover:text-gray-700" 
                        onClick={() => handleSort('efficiencyScore')}
                      >
                        Efficiency {getSortIndicator('efficiencyScore')}
                      </button>
                    </th>
                    <th className="py-3 px-3 hidden lg:table-cell">
                      <button 
                        className="flex items-center gap-1 hover:text-gray-700" 
                        onClick={() => handleSort('startTime')}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Started {getSortIndicator('startTime')}
                      </button>
                    </th>
                  </>
                )}
                <th className="py-3 pl-3 hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leaderboardData.map((participant, index) => (
                <tr 
                  key={participant.id} 
                  className={`${getRowBackground(index)} hover:bg-gray-50 transition-colors`}
                >
                  <td className="py-4 pr-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {getMedal(index)}
                    </div>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-gray-900">{participant.totalScore}</div>
                      <div className="text-xs text-gray-500">{Math.round(participant.scorePercentage)}%</div>
                    </div>
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm text-gray-900">
                      {formatTime(participant.completionTime)}
                    </div>
                  </td>
                  {showAdvancedStats && (
                    <>
                      <td className="py-4 px-3 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900">
                          {Math.round(participant.questionAccuracy)}%
                        </div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          {formatNumber(participant.efficiencyScore.toFixed(1))}
                        </div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-gray-500">
                          {participant.startTime ? formatDate(participant.startTime) : '--'}
                        </div>
                      </td>
                    </>
                  )}
                  <td className="py-4 pl-3 whitespace-nowrap hidden sm:table-cell">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      participant.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {participant.status === 'completed' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : null}
                      {participant.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {leaderboardData.length === 0 && (
                <tr>
                  <td 
                    colSpan={showAdvancedStats ? 8 : 5} 
                    className="py-8 text-center text-gray-500"
                  >
                    No participants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Performance Summary */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Average Score</h4>
            <p className="text-2xl font-bold text-blue-600">
              {leaderboardData.length > 0 
                ? formatNumber(Math.round(
                    leaderboardData.reduce((sum, p) => sum + p.totalScore, 0) / leaderboardData.length
                  ))
                : '0'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              out of {formatNumber(totalPossibleScore)} possible points
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Average Completion Time</h4>
            <p className="text-2xl font-bold text-purple-600">
              {leaderboardData.length > 0
                ? formatTime(
                    leaderboardData.reduce((sum, p) => sum + p.completionTime, 0) / leaderboardData.length
                  )
                : '--'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {leaderboardData.filter(p => p.status === 'completed').length} completed
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Top Score</h4>
            <p className="text-2xl font-bold text-green-600">
              {leaderboardData.length > 0
                ? formatNumber(Math.max(...leaderboardData.map(p => p.totalScore)))
                : '0'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {leaderboardData.length > 0 && leaderboardData.sort((a, b) => b.totalScore - a.totalScore)[0]?.name || 'No participants'}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Participation</h4>
            <p className="text-2xl font-bold text-yellow-500">
              {leaderboardData.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {Math.round((leaderboardData.filter(p => p.status === 'completed').length / leaderboardData.length) * 100) || 0}% completion rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTab;