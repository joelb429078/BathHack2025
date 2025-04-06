import React from 'react';
import { Calendar } from 'lucide-react';

const SessionSelector = ({ sessions, selectedSessionId, onSessionChange }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '--';
    
    // Shorter format for mobile
    if (window.innerWidth < 640) {
      return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-0">Select Session</h2>
        <span className="text-xs sm:text-sm text-gray-500">{sessions.length} sessions available</span>
      </div>
      
      {sessions.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No sessions available
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSessionChange(session.id)}
              className={`p-3 sm:p-4 rounded-lg border transition-all ${
                selectedSessionId === session.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">
                      Session #{session.id.slice(-4)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      {formatDate(session.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionSelector;