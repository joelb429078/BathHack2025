// hooks/useResultsData.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';

export const useResultsData = (formId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  const [metrics, setMetrics] = useState({
    totalRespondents: 0,
    activeRespondents: 0,
    totalPoints: 0,
    completionRate: 0
  });

  // Process components to ensure proper text formatting
  const processComponents = useCallback((components) => {
    return components.map(comp => {
      if (comp.type === 'text') {
        if (typeof comp.text === 'string') {
          comp.text = {
            text: comp.text,
            format: {
              bold: false,
              italic: false,
              align: 'left',
              size: 'text-base',
              color: 'text-gray-900'
            }
          };
        } else if (comp.text && !comp.text.format) {
          comp.text.format = {
            bold: false,
            italic: false,
            align: 'left',
            size: 'text-base',
            color: 'text-gray-900'
          };
        }
      }
      return comp;
    });
  }, []);

  // Calculate metrics from responses
  const calculateMetrics = useCallback((responses) => {
    const total = responses.length;
    const active = responses.filter(r => r.status === "in-progress").length;
    const completed = responses.filter(r => r.status === "completed").length;
    const totalPoints = responses.reduce((sum, r) => sum + (r.totalScore || 0), 0);

    return {
      totalRespondents: total,
      activeRespondents: active,
      totalPoints,
      completionRate: total ? Math.round((completed / total) * 100) : 0
    };
  }, []);

  // Handle session selection
  const selectSession = useCallback((sessionId) => {
    setSessions(prevSessions => {
      const session = prevSessions.find(s => s.id === sessionId);
      if (session) {
        setSelectedSession(session);
      }
      return prevSessions;
    });
  }, []);

  // Load initial form data and sessions
  useEffect(() => {
    let unsubscribeSessions;

    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Get form data and questions
        const formRef = doc(db, "forms", formId);
        const [formSnap, questionsSnap] = await Promise.all([
          getDoc(formRef),
          getDocs(collection(formRef, "questions"))
        ]);

        if (!formSnap.exists()) throw new Error("Form not found");
        setFormData(formSnap.data());

        if (!questionsSnap.empty) {
          const loadedQuestions = questionsSnap.docs
            .map(doc => ({
              id: parseInt(doc.id, 10),
              ...doc.data(),
              components: processComponents(doc.data().components || [])
            }))
            .sort((a, b) => a.id - b.id);
          setQuestions(loadedQuestions);
        }

        // Set up real-time listener for sessions
        const sessionsRef = collection(db, "sessions");
        const sessionsQuery = query(sessionsRef, where("formId", "==", formId));
        
        unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
          const loadedSessions = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
          
          setSessions(loadedSessions);

          // Set first session as default if no session is selected
          if (!selectedSession && loadedSessions.length > 0) {
            setSelectedSession(loadedSessions[0]);
          }
        });

      } catch (err) {
        console.error("Error fetching form data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      if (unsubscribeSessions) {
        unsubscribeSessions();
      }
    };
  }, [formId, selectedSession, processComponents]);

  // Real-time responses listener
  useEffect(() => {
    if (!selectedSession) return;

    let unsubscribe;

    try {
      // Set up real-time listener for responses
      const responsesRef = collection(db, "responses");
      const responsesQuery = query(
        responsesRef, 
        where("sessionId", "==", selectedSession.id)
      );
      
      unsubscribe = onSnapshot(responsesQuery, (snapshot) => {
        const loadedResponses = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setResponses(loadedResponses);
        setMetrics(calculateMetrics(loadedResponses));
      });

    } catch (err) {
      console.error("Error setting up responses listener:", err);
      setError(err.message);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedSession, calculateMetrics]);

  return {
    loading,
    error,
    formData,
    sessions,
    selectedSession,
    selectSession,
    responses,
    questions,
    metrics
  };
};

export default useResultsData;