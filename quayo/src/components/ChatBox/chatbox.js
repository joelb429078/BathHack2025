import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, query, onSnapshot, serverTimestamp, deleteDoc, getDocs, where } from "firebase/firestore";
import { Bot, User, Trash2, Loader } from "lucide-react";
import { db } from "../../firebase";

const ChatBox = ({ formId, onClose }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for messages from Firebase
  useEffect(() => {
    const q = query(collection(db, "chatbot"), where("formId", "==", formId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [formId]);

  // Clear all messages
  const clearChat = async () => {
    if (!window.confirm("Clear all messages?")) return;
    setLoading(true);
    const q = query(collection(db, "chatbot"), where("formId", "==", formId));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
    setLoading(false);
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    await addDoc(collection(db, "chatbot"), {
      sender: "user",
      message: inputValue,
      createdAt: serverTimestamp(),
      formId
    });

    // Simple bot response (replace with actual API call)
    const botResponse = `Echo: ${inputValue}`;
    await addDoc(collection(db, "chatbot"), {
      sender: "chatbot",
      message: botResponse,
      createdAt: serverTimestamp(),
      formId
    });

    setInputValue("");
    setLoading(false);
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 p-4 flex justify-between items-center">
        <h1 className="text-xl text-white">Chat</h1>
        <div>
          <button onClick={clearChat} disabled={loading} className="text-white mr-2">
            <Trash2 size={20} />
          </button>
          <button onClick={onClose} className="text-white text-xl">×</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className="flex items-center space-x-2">
              {msg.sender === "chatbot" && <Bot size={20} className="text-emerald-600" />}
              <div className={`p-3 rounded-lg ${
                msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}>
                {msg.message}
              </div>
              {msg.sender === "user" && <User size={20} className="text-blue-600" />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2">
            <Loader size={20} className="animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;