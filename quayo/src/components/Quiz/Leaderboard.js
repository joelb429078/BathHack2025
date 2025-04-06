import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Award, ChevronDown, ChevronUp, User, Users } from 'lucide-react';

const Leaderboard = ({ sessionId }) => {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true); // Default to expanded
  const [error, setError] = useState(null);
  
  // States for the real-time data
  const [respondents, setRespondents] = useState([]);
  const [responses, setResponses] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  // Get current user's respondent ID
  const currentRespondentId = sessionStorage.getItem(`respondentId_${sessionId}`);
  
  // 1. Listen to the 'respondents' collection for real-time updates
  useEffect(() => {
    if (!sessionId) return;
    
    setLoading(true);
    
    const q = query(
      collection(db, "respondents"),
      where("sessionId", "==", sessionId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const respList = [];
        snapshot.forEach((docSnap) => {
          respList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRespondents(respList);
        setError(null);
      },
      (error) => {
        console.error("Error fetching respondents:", error);
        setError("Failed to load leaderboard data");
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [sessionId]);
  
  // 2. Listen to the 'responses' collection for real-time updates
  useEffect(() => {
    if (!sessionId) return;
    
    const q = query(
      collection(db, "responses"),
      where("sessionId", "==", sessionId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const responseList = [];
        snapshot.forEach((docSnap) => {
          responseList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setResponses(responseList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching responses:", error);
        setError("Failed to load leaderboard data");
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [sessionId]);
  
  // 3. Join respondents and responses to create the leaderboard
  useEffect(() => {
    // Only proceed if we have both data sets
    if (respondents.length === 0 && responses.length === 0) {
      return;
    }
    
    // For each respondent, find its matching response
    const combined = respondents.map((r) => {
      // Look up the response with the same respondentId
      const matchingResponse = responses.find(
        (res) => res.respondentId === r.id
      );
      
      return {
        rank: 0, // Will be set after sorting
        id: r.id,
        respondentId: r.id,
        name: r.name || "Anonymous",
        score: matchingResponse?.totalScore || 0,
        isCurrentUser: r.id === currentRespondentId
      };
    });
    
    // Add responses that might not have a matching respondent
    responses.forEach(res => {
      if (!combined.some(item => item.respondentId === res.respondentId) && res.respondentId) {
        combined.push({
          rank: 0,
          id: res.id,
          respondentId: res.respondentId,
          name: "Anonymous",
          score: res.totalScore || 0,
          isCurrentUser: res.respondentId === currentRespondentId
        });
      }
    });
    
    // Sort by score (descending) and assign ranks
    combined.sort((a, b) => b.score - a.score);
    combined.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    setLeaderboardData(combined);
  }, [respondents, responses, currentRespondentId]);

  // Find the current user's entry
  const currentUserEntry = leaderboardData.find(entry => entry.isCurrentUser);
  const userRank = currentUserEntry?.rank;
  const isUserInTopTen = userRank && userRank <= 10;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Award size={20} />
            Leaderboard
          </h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="relative w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Award size={20} />
            Leaderboard
          </h3>
        </div>
        <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center">
          <Users size={40} className="text-gray-300 mb-3" />
          <p>Unable to load leaderboard data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        className="bg-indigo-600 px-6 py-4 flex items-center justify-between cursor-pointer transition-colors duration-200 hover:bg-indigo-700"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Award size={20} />
          Leaderboard {leaderboardData.length > 0 ? `(${leaderboardData.length})` : ''}
        </h3>
        <button className="text-white p-1 rounded-full transition-all duration-300 transform">
          <div className={`transition-transform duration-300 transform ${expanded ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown size={20} />
          </div>
        </button>
      </div>
      
      <div 
        className={`divide-y divide-gray-100 overflow-hidden transition-all duration-500 ease-in-out ${
          expanded 
            ? 'max-h-96 opacity-100 transform translate-y-0' 
            : 'max-h-0 opacity-0 transform -translate-y-4'
        }`}
      >
          {leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center justify-center">
              <Users size={40} className="text-gray-300 mb-3" />
              <p>No submissions yet. Be the first to complete the quiz!</p>
            </div>
          ) : (
            leaderboardData.slice(0, 10).map((entry) => (
              <div 
                key={entry.id} 
                className={`flex items-center p-4 ${
                  entry.isCurrentUser ? 'bg-indigo-50' : ''
                } hover:bg-gray-50 transition-colors`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  entry.rank <= 3 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'text-gray-700'
                }`}>
                  {entry.rank}
                </div>
                
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-3">
                  <User size={20} className={entry.isCurrentUser ? "text-indigo-600" : "text-gray-600"} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${entry.isCurrentUser ? 'text-indigo-700' : 'text-gray-900'} truncate`}>
                    {entry.name}
                    {entry.isCurrentUser && <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">You</span>}
                  </p>
                </div>
                
                <div className="font-semibold text-lg text-indigo-600">
                  {entry.score} pts
                </div>
              </div>
            ))
          )}
          
          {userRank && !isUserInTopTen && (
            <div className="bg-gray-50 p-4 border-t border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-700">
                  {userRank}
                </div>
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-3">
                  <User size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-700 truncate">
                    You
                  </p>
                </div>
                <div className="font-semibold text-lg text-indigo-600">
                  {currentUserEntry?.score || 0} pts
                </div>
              </div>
            </div>
          )}
        </div>
    </div>

  );
};

export default Leaderboard;