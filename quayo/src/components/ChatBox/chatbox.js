import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  getDocs,
  where,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { Sparkles, Send, Bot, User, Trash2, Loader } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { db } from "../../firebase";

const ChatBox = ({ formId, onClose, onQuestionsAdded, onFormStateReady }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const messagesEndRef = useRef(null);
  const formStateRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Expose the formStateRef to parent component
  useEffect(() => {
    if (onFormStateReady && typeof onFormStateReady === 'function') {
      onFormStateReady(formStateRef);
    }
  }, [onFormStateReady]);

  useEffect(() => {
    // Simple query by formId only
    const q = query(
      collection(db, "chatbot"),
      where("formId", "==", formId)
    );

    console.log("Setting up messages listener for form:", formId);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Received message update, count:", snapshot.size);
      
      // Process and sort messages after receiving them
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isNew: lastMessageTimestamp === null ? false : 
               doc.data().createdAt?.seconds > lastMessageTimestamp
      }))
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        setLastMessageTimestamp(lastMessage.createdAt?.seconds || 0);
      }

      setMessages(newMessages);
      console.log("Updated messages:", newMessages);
    });

    return () => unsubscribe();
  }, [formId, lastMessageTimestamp]);

  const clearChat = async () => {
    if (!window.confirm("Are you sure you want to clear all chat messages?")) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, "chatbot"),
        where("formId", "==", formId)
      );
      
      const snapshot = await getDocs(q);
      console.log("Clearing messages, count:", snapshot.size);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      setMessages([]);
      setLastMessageTimestamp(null);
    } catch (error) {
      console.error("Error clearing chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const TypewriterText = ({ text, isNew }) => {
    const [displayText, setDisplayText] = useState(isNew ? "" : text);
    const [currentIndex, setCurrentIndex] = useState(0);
  
    useEffect(() => {
      if (!isNew) {
        setDisplayText(text);
        return;
      }

      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(c => c + 1);
        }, 15); // Faster typing speed
        return () => clearTimeout(timeout);
      }
    }, [currentIndex, text, isNew]);
  
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{displayText}</ReactMarkdown>
      </div>
    );
  };

  const appendQuestionsToForm = async (questionData) => {
    try {
      setGeneratingQuiz(true);
      if (!formId) {
        throw new Error("No form ID provided");
      }
      
      console.log("Appending questions to form:", formId);
      console.log("Question data sample:", JSON.stringify(questionData[0] || {}).substring(0, 200));
      
      // Get the current form data
      const formDocRef = doc(db, "forms", formId);
      const formSnapshot = await getDoc(formDocRef);
      
      // If form doesn't exist, save it first
      if (!formSnapshot.exists()) {
        console.log("Form not found. Saving current form before proceeding.");
        
        // Save the current form if formStateRef is available
        if (formStateRef.current && typeof formStateRef.current.saveToFirebase === 'function') {
          await formStateRef.current.saveToFirebase();
          
          // Check again if the form exists after saving
          const refreshedSnapshot = await getDoc(formDocRef);
          if (!refreshedSnapshot.exists()) {
            console.error("Form not found with ID:", formId);
            throw new Error("Form could not be created. Please try saving the form manually first.");
          }
        } else {
          console.error("Form not found with ID:", formId);
          throw new Error("Form not found. Please save your form first.");
        }
      }
      
      console.log("Found form document");
      
      // Get existing questions to determine proper ordering
      const questionsCollRef = collection(formDocRef, "questions");
      const questionsSnapshot = await getDocs(questionsCollRef);
      console.log("Found existing questions count:", questionsSnapshot.size);
      
      const existingQuestions = questionsSnapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      }));
      
      // Sort by order to find the highest order value
      const sortedQuestions = [...existingQuestions].sort((a, b) => a.order - b.order);
      const lastOrder = sortedQuestions.length > 0 ? sortedQuestions[sortedQuestions.length - 1].order : -1;
      const lastId = sortedQuestions.length > 0 
        ? Math.max(...sortedQuestions.map(q => parseInt(q.id)))
        : 0;
      
      console.log("Last question ID:", lastId);
      console.log("Last question order:", lastOrder);
      
      // Add new questions with correct order and ID
      let addedCount = 0;
      const newQuestionIds = [];
      
      for (let i = 0; i < questionData.length; i++) {
        const question = questionData[i];
        const newId = lastId + i + 1;
        const newOrder = lastOrder + i + 1;
        
        console.log(`Adding question ${newId} with order ${newOrder}`);
        
        try {
          // Ensure components array exists
          if (!question.components || !Array.isArray(question.components)) {
            console.error("Missing components array in question:", i);
            question.components = [];
          }
          
          // Verify components have required fields
          question.components.forEach((comp, idx) => {
            if (!comp.position) {
              console.warn(`Adding default position to component ${idx} in question ${i}`);
              comp.position = { top: 100 + idx * 50, left: 100 + idx * 20 };
            }
            if (!comp.opacity && comp.opacity !== 0) {
              comp.opacity = 1;
            }
          });
          
          const questionDocRef = doc(collection(formDocRef, "questions"), newId.toString());
          
          await setDoc(questionDocRef, {
            id: newId,
            backgroundColor: question.backgroundColor || "#FFFFFF",
            points: question.points || 0,
            maxAttempts: question.maxAttempts || 0,
            order: newOrder,
            components: question.components || []
          });
          
          console.log(`Successfully added question ${newId}`);
          newQuestionIds.push(newId);
          addedCount++;
        } catch (questionError) {
          console.error(`Error adding question ${newId}:`, questionError);
        }
      }
      
      console.log(`Added ${addedCount} questions to form`);
      
      // Notify parent component about the added questions
      if (onQuestionsAdded && typeof onQuestionsAdded === 'function') {
        onQuestionsAdded(addedCount, newQuestionIds);
      }
      
      return addedCount;
    } catch (error) {
      console.error("Error appending questions:", error);
      throw error;
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const getChatbotResponse = async (userMessage) => {
    // Use environment variable if available, fallback to hardcoded key
    const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found");
      return "Error: API key not configured.";
    }

    try {
      // Determine if user is requesting quiz questions
      const isQuizRequest = userMessage.toLowerCase().includes("create") || 
                           userMessage.toLowerCase().includes("add") || 
                           userMessage.toLowerCase().includes("make");
      
      const hasTopic = userMessage.toLowerCase().includes("quiz") || 
                       userMessage.toLowerCase().includes("question") || 
                       userMessage.toLowerCase().includes("test");
      
      const willGenerateQuiz = isQuizRequest && hasTopic;
      
      // Special system prompt for quiz creation
      const systemPrompt = willGenerateQuiz ? 
        `You are an expert quiz designer and AI assistant for a quiz creation platform.

CRUCIAL INSTRUCTION: You MUST include a JSON array of questions in your response, formatted exactly as shown below. This JSON MUST be wrapped in triple backticks with the json tag. For example:

\`\`\`json
[{"question": "data"}]
\`\`\`

This JSON structure is REQUIRED for the application to function properly. Do not skip this step.

When users ask you to create quiz questions, follow these guidelines:
1. Design questions that fit within an 800x600 canvas
2. Use a maximum of 25 components per question
3. Create visually appealing layouts with balanced component placement
4. Generate educational and meaningful content related to the requested topic

COMPONENT TYPES AND STRUCTURE:
Each component must follow these exact structures:

1. Text component:
{
  "id": 1,
  "type": "text",
  "position": {"top": 50, "left": 200},
  "width": 400, 
  "height": 64,
  "opacity": 1,
  "text": {
    "text": "Your text content here",
    "format": {
      "bold": false,
      "italic": false,
      "align": "center",
      "size": "text-xl",
      "color": "#000000",
      "font": "Arial"
    }
  }
}

2. True/False component:
{
  "id": 2,
  "type": "true_false",
  "position": {"top": 120, "left": 300},
  "width": 128,
  "height": 56,
  "opacity": 1,
  "value": false
}

3. Multiple Choice (Single) component:
{
  "id": 3,
  "type": "multiple_choice_single",
  "position": {"top": 200, "left": 250},
  "width": 288,
  "height": 200,
  "opacity": 1,
  "options": ["Option 1", "Option 2", "Option 3"],
  "correctIndex": 0
}

4. Multiple Choice (Multi) component:
{
  "id": 4,
  "type": "multiple_choice_multi",
  "position": {"top": 200, "left": 250},
  "width": 288,
  "height": 200,
  "opacity": 1,
  "options": ["Option A", "Option B", "Option C"],
  "correctAnswers": [0, 2]
}

5. Ranking component:
{
  "id": 5,
  "type": "ranking",
  "position": {"top": 150, "left": 250},
  "width": 320,
  "height": 220,
  "opacity": 1,
  "items": ["Item 1", "Item 2", "Item 3"],
  "correctOrder": [0, 1, 2]
}

EXAMPLE OF A COMPLETE RESPONSE FORMAT:
Start with a friendly message describing what you're creating.
Then include the required JSON structure like this:

\`\`\`json
[
  {
    "backgroundColor": "#F8F9FA",
    "points": 10,
    "maxAttempts": 1,
    "components": [
      {
        "id": 1,
        "type": "text",
        "position": {"top": 50, "left": 100},
        "width": 600,
        "height": 80,
        "opacity": 1,
        "text": {
          "text": "Question title goes here",
          "format": {
            "bold": true,
            "italic": false,
            "align": "center",
            "size": "text-xl",
            "color": "#000000",
            "font": "Arial"
          }
        }
      },
      {
        "id": 2,
        "type": "multiple_choice_single",
        "position": {"top": 150, "left": 250},
        "width": 288,
        "height": 200,
        "opacity": 1,
        "options": ["Option 1", "Option 2", "Option 3"],
        "correctIndex": 0
      }
    ]
  }
]
\`\`\`

IMPORTANT REMINDER: The JSON structure is ABSOLUTELY REQUIRED. If you do not include it, the application will not be able to add the questions to the form.`
        :
        "You are a quiz maker and design bot who provides insightful and concise responses.";

      console.log("Is quiz request:", willGenerateQuiz);
      
      // Make API request
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 2500, // Increased token limit for quiz generation
        }),
      });
      
      const data = await response.json();
      let responseContent = data.choices?.[0]?.message?.content || "Sorry, I didn't understand that.";
      
      console.log("Response from API (first 500 chars):", responseContent.substring(0, 500));
      console.log("Response contains JSON marker:", responseContent.includes("```json"));
      
      // Check if the response contains JSON structure for questions
      if (willGenerateQuiz) {
        try {
          // Look for JSON structure in the response with various patterns
          const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                           responseContent.match(/```\s*([\[\{][\s\S]*?[\]\}])\s*```/) ||
                           responseContent.match(/\[\s*\{\s*"backgroundColor"[\s\S]*\}\s*\]/);
          
          console.log("JSON match found:", !!jsonMatch);
          
          if (jsonMatch) {
            const jsonString = jsonMatch[1] || jsonMatch[0];
            console.log("Extracted JSON (first 200 chars):", jsonString.substring(0, 200) + "...");
            
            try {
              // Parse the JSON string
              const parsedData = JSON.parse(jsonString.replace(/```/g, '').trim());
              console.log("Successfully parsed JSON");
              console.log("Parsed data type:", Array.isArray(parsedData) ? "array" : typeof parsedData);
              console.log("Parsed data length:", Array.isArray(parsedData) ? parsedData.length : "not an array");
              
              let questionData;
              
              // If we have an array of questions, use it directly
              if (Array.isArray(parsedData)) {
                questionData = parsedData;
                console.log("Using array of questions directly");
              } 
              // If we have a complete form object with questions array, extract and use the questions
              else if (parsedData.questions && Array.isArray(parsedData.questions)) {
                questionData = parsedData.questions;
                console.log("Extracted questions array from form object");
              }
              // If we have a single question object, wrap it in an array
              else if (parsedData.components && Array.isArray(parsedData.components)) {
                questionData = [parsedData];
                console.log("Wrapped single question in array");
              }
              else {
                // If we can't determine the structure, throw an error
                console.log("Invalid question data structure:", JSON.stringify(parsedData).substring(0, 100) + "...");
                throw new Error("Invalid question data structure");
              }
              
              // Now append the questions to the form
              console.log("Attempting to add questions to form:", questionData.length);
              
              if (questionData.length > 0) {
                console.log("First question sample:", JSON.stringify(questionData[0]).substring(0, 100) + "...");
                const addedCount = await appendQuestionsToForm(questionData);
                console.log("Successfully added questions:", addedCount);
                
                // Create a user-friendly response without the JSON
                const humanReadableResponse = responseContent.replace(/```json[\s\S]*?```/g, '').trim();
                
                // Add confirmation about the added questions
                return `${humanReadableResponse}\n\nI've added ${addedCount} new question${addedCount !== 1 ? 's' : ''} to your form. You can now edit these questions further or use them as they are.`;
              } else {
                console.log("No questions found in the parsed data");
                throw new Error("No questions found in the parsed data");
              }
            } catch (parseError) {
              console.error("JSON parsing error:", parseError);
              return `${responseContent}\n\nI was supposed to create questions for you, but I couldn't parse the JSON structure. Technical error: ${parseError.message}. Please try again.`;
            }
          } else {
            console.log("No JSON match found in the response");
            // If we didn't find JSON in the response, try a second request explicitly asking for the JSON
            
            console.log("Attempting second request to get JSON explicitly");
            const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: "You are a quiz generator that responds ONLY with a JSON array of questions. Format with ```json and ``` wrapping the content." },
                  { role: "user", content: `Based on this request: "${userMessage}", generate ONLY a JSON array of quiz questions to add to a form. Your entire response must be a JSON array wrapped in triple backticks with the json tag.` }
                ],
                temperature: 0.7,
                max_tokens: 2500,
              }),
            });
            
            const secondData = await secondResponse.json();
            const secondResponseContent = secondData.choices?.[0]?.message?.content || "";
            
            console.log("Second response received");
            console.log("Contains JSON marker:", secondResponseContent.includes("```json"));
            
            const secondJsonMatch = secondResponseContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                                  secondResponseContent.match(/```\s*([\[\{][\s\S]*?[\]\}])\s*```/) ||
                                  secondResponseContent.match(/\[\s*\{\s*"backgroundColor"[\s\S]*\}\s*\]/);
            
            if (secondJsonMatch) {
              console.log("JSON found in second attempt");
              try {
                const jsonString = secondJsonMatch[1] || secondJsonMatch[0];
                const questionData = JSON.parse(jsonString.replace(/```/g, '').trim());
                
                if (Array.isArray(questionData) && questionData.length > 0) {
                  const addedCount = await appendQuestionsToForm(questionData);
                  return `${responseContent}\n\nI've added ${addedCount} new question${addedCount !== 1 ? 's' : ''} to your form. You can now edit these questions further or use them as they are.`;
                }
              } catch (secondError) {
                console.error("Second attempt JSON parsing error:", secondError);
              }
            }
            
            return `${responseContent}\n\nI was supposed to create questions for you, but I couldn't generate the proper structure. Please try again with more specific details about what kind of questions you'd like.`;
          }
        } catch (error) {
          console.error("Error in overall question processing:", error);
          return `${responseContent}\n\nI tried to create questions based on your request, but there was an error: ${error.message}. Please try again with more specific details.`;
        }
      }
      
      return responseContent;
    } catch (error) {
      console.error("Error fetching OpenAI API:", error);
      return "Error: Unable to get a response. " + error.message;
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === "") return;

    try {
      // Add user message
      await addDoc(collection(db, "chatbot"), {
        sender: "user",
        message: inputValue,
        createdAt: serverTimestamp(),
        formId: formId
      });

      const userMessage = inputValue;
      setInputValue("");
      setLoading(true);

      // Check if the message is asking to create a quiz
      const isQuizRequest = userMessage.toLowerCase().includes("create") || 
                           userMessage.toLowerCase().includes("add") || 
                           userMessage.toLowerCase().includes("make");
      
      const hasTopic = userMessage.toLowerCase().includes("quiz") || 
                      userMessage.toLowerCase().includes("question") || 
                      userMessage.toLowerCase().includes("test");
      
      if (isQuizRequest && hasTopic) {
        setGeneratingQuiz(true);
      }

      // Get and add bot response
      const chatbotResponse = await getChatbotResponse(userMessage);
      await addDoc(collection(db, "chatbot"), {
        sender: "chatbot",
        message: chatbotResponse,
        createdAt: serverTimestamp(),
        formId: formId
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
      setGeneratingQuiz(false);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-white" size={24} />
          <h1 className="text-xl font-semibold text-white">Quiz Designer AI</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            disabled={loading || generatingQuiz}
            className="p-2 text-white hover:text-red-200 transition-colors"
            title="Clear chat history"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center p-6 text-gray-500">
            <Bot size={40} className="mx-auto mb-3 text-blue-500 opacity-70" />
            <h3 className="font-semibold text-gray-700 mb-1">Quiz Designer AI</h3>
            <p className="text-sm mb-3">Hello! I can help you add questions to your current form or answer questions about the quiz builder.</p>
            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto text-sm">
              <button 
                onClick={() => setInputValue("Create 3 multiple choice questions about solar system planets")}
                className="p-2 text-left rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Create 3 multiple choice questions about solar system planets
              </button>
              <button 
                onClick={() => setInputValue("Add a true/false question about American history")}
                className="p-2 text-left rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Add a true/false question about American history
              </button>
              <button 
                onClick={() => setInputValue("Create a ranking question about the tallest buildings")}
                className="p-2 text-left rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Create a ranking question about the tallest buildings
              </button>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2 ${
              msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.sender === "user" ? "bg-blue-100" : "bg-emerald-100"
            }`}>
              {msg.sender === "user" ? (
                <User size={20} className="text-blue-600" />
              ) : (
                <Bot size={20} className="text-emerald-600" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.sender === "chatbot" ? (
                <TypewriterText text={msg.message} isNew={msg.isNew} />
              ) : (
                msg.message
              )}
            </div>
          </div>
        ))}
        
        {generatingQuiz && (
          <div className="flex items-start space-x-2 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Bot size={20} className="text-emerald-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[75%]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader size={18} className="text-blue-500 animate-spin" />
                    {/* Add pulsing effect around the loader */}
                    <div className="absolute inset-0 animate-ping opacity-30 rounded-full bg-blue-400" 
                        style={{animationDuration: "3s"}}></div>
                  </div>
                  <div className="text-gray-700">
                    <p className="font-medium">Creating quiz questions...</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Designing interactive components for your form
                    </p>
                  </div>
                </div>
                
                {/* Add a progress indicator */}
                <div className="space-y-2 pt-1">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 w-0 animate-progress-bar" 
                        style={{
                          animationDuration: "15s",
                          animationTimingFunction: "cubic-bezier(0.1, 0.5, 0.5, 1)"
                        }}></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Processing</span>
                    <span>Creating</span>
                    <span>Adding</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        {loading && !generatingQuiz && (
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Bot size={20} className="text-emerald-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleUserSubmit} className="border-t border-gray-100 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ask me to add questions to your current form..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading || generatingQuiz}
          />
          <button
            type="submit"
            disabled={loading || generatingQuiz}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;