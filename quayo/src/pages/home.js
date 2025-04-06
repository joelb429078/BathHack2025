import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { getUserData } from "../services/userService";
import {
  FileText,
  Trash,
  Plus,
  Grid,
  List,
  Eye,
  Edit,
  Share2,
  Search,
  SlidersHorizontal,
  Clock,
  Check,
  Star,
  StarHalf,
} from "lucide-react";
import { useToast } from "../components/Toast";
import Store from "./store"; 

const Home = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [userData, setUserData] = useState(null);
  const [userForms, setUserForms] = useState([]);
  const [activeTab, setActiveTab] = useState("myForms");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hoveredFormId, setHoveredFormId] = useState(null);

  // Categories for filtering
  const categories = ["other", "general", "educational", "training", "certification", "skillbuilding"];

  useEffect(() => {
    const loadUserData = async () => {
      if (auth.currentUser) {
        try {
          const data = await getUserData(auth.currentUser.uid);
          setUserData(data);
        } catch (error) {
          console.error("Error loading user data:", error);
          addToast("Failed to load user data", "error");
        }
      }
    };
    loadUserData();
  }, [addToast]);

  useEffect(() => {
    const fetchUserForms = async () => {
      if (!auth.currentUser) return;
      try {
        const formsRef = collection(db, "forms");
        const q = query(formsRef, where("userId", "==", auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const formsArray = [];
          querySnapshot.forEach((docSnap) => {
            const formData = { id: docSnap.id, ...docSnap.data() };
            formsArray.push(formData);
          });
          setUserForms(formsArray);
        }, (error) => {
          console.error("Error fetching user forms:", error);
          addToast("Failed to load your forms", "error");
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up user forms listener:", error);
        addToast("Failed to load your forms", "error");
      }
    };

    fetchUserForms();
  }, [addToast]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      addToast("Signed out successfully", "success");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      addToast("Failed to sign out", "error");
    }
  };

  const handleGeneralFormClick = async () => {
    if (!auth.currentUser) {
      addToast("Please sign in to create a form", "error");
      return;
    }

    if (userForms.length >= 3) {
      addToast("Maximum of 3 forms reached!", "warning");
      return;
    }

    const userId = auth.currentUser.uid;
    const formId = Date.now().toString();

    try {
      await setDoc(doc(db, "forms", formId), {
        userId,
        formType: "General Form",
        formTitle: "",
        formDescription: "",
        formImage: null,
        category: "other",
        createdAt: new Date(),
        likes: 0,
      });
      addToast("Form created successfully", "success");
      navigate(`/forms/${formId}`);
    } catch (error) {
      console.error("Error creating form:", error);
      addToast("Failed to create form", "error");
    }
  };

  const handleDelete = async (event, id) => {
    event.stopPropagation();
    try {
      await deleteDoc(doc(db, "forms", id));
      setUserForms((prevForms) => prevForms.filter((form) => form.id !== id));
      addToast("Form deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting form:", error);
      addToast("Failed to delete form", "error");
    }
  };

  const handleUseTemplate = async (quiz) => {
    if (!auth.currentUser) {
      addToast("Please sign in to add this quiz", "error");
      navigate("/login");
      return;
    }

    const formsRef = collection(db, "forms");
    const q = query(formsRef, where("userId", "==", auth.currentUser.uid));
    const userFormsSnap = await getDocs(q);
    if (userFormsSnap.size >= 3) {
      addToast("Maximum of 3 forms reached!", "warning");
      return;
    }

    const userId = auth.currentUser.uid;
    const newFormId = Date.now().toString();

    try {
      const formDocRef = doc(db, "forms", quiz.id);
      const formSnap = await getDoc(formDocRef);
      if (!formSnap.exists()) throw new Error("Form not found");
      const formData = { id: quiz.id, ...formSnap.data() };

      const questionsCollRef = collection(formDocRef, "questions");
      const questionsSnap = await getDocs(questionsCollRef);
      const questions = questionsSnap.docs.map((docSnap) => ({
        id: parseInt(docSnap.id, 10),
        ...docSnap.data(),
      }));

      const newFormData = {
        formType: formData.formType || "General Form",
        formTitle: formData.formTitle || "",
        formDescription: formData.formDescription || "",
        formImage: formData.formImage || null,
        category: formData.category || "other",
        createdAt: new Date(),
        likes: 0,
        userId,
      };

      await setDoc(doc(db, "forms", newFormId), newFormData);

      for (const question of questions) {
        await setDoc(doc(db, "forms", newFormId, "questions", question.id.toString()), {
          ...question,
        });
      }

      try {
        const downloads = formData.downloads || 0;
        await updateDoc(formDocRef, { downloads: downloads + 1 });
      } catch (downloadError) {
        console.error("Error updating downloads count:", downloadError);
      }

      addToast("Quiz added to your forms successfully", "success");
      navigate("/");
    } catch (error) {
      console.error("Error adding quiz to forms:", error);
      addToast("Failed to add quiz to your forms", "error");
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      general: "bg-blue-100 text-blue-800 border-blue-300",
      educational: "bg-purple-100 text-purple-800 border-purple-300",
      training: "bg-green-100 text-green-800 border-green-300",
      certification: "bg-yellow-100 text-yellow-800 border-yellow-300",
      skillbuilding: "bg-pink-100 text-pink-800 border-pink-300",
      other: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[category] || colors.other;
  };

  // Get random accent color for cards without images
  const getRandomAccentColor = (id) => {
    const colors = [
      "from-blue-500 to-cyan-400",
      "from-purple-500 to-pink-400",
      "from-green-500 to-emerald-400",
      "from-amber-500 to-yellow-400",
      "from-red-500 to-rose-400",
      "from-indigo-500 to-violet-400",
    ];
    // Use the last character of the ID to determine the color
    const index = parseInt(id.slice(-1), 16) % colors.length;
    return colors[index];
  };

  // Filter and sort forms
  const filteredAndSortedForms = userForms
    .filter((form) => {
      const matchesSearch = 
        (form.formTitle || "Untitled Form").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (form.formDescription || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || form.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt);
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt?.toDate?.() || a.createdAt) - new Date(b.createdAt?.toDate?.() || b.createdAt);
      } else if (sortBy === "alphabetical") {
        return (a.formTitle || "Untitled Form").localeCompare(b.formTitle || "Untitled Form");
      }
      return 0;
    });

  // Quick action button component
  const QuickActionButton = ({ icon, label, onClick, color = "bg-gray-100 hover:bg-gray-200 text-gray-700" }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-full ${color} transition-all duration-200 flex items-center justify-center tooltip-container`}
    >
      {icon}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-2xl font-extrabold tracking-wide">
                Quayo
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm font-medium">
                {userData?.displayName || auth.currentUser?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-blue-100 transition-colors duration-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Centered Tab Toggle with Animation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-full shadow-lg p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab("myForms")}
              className={`relative px-6 py-3 font-semibold text-lg rounded-full transition-all duration-300 transform ${
                activeTab === "myForms"
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-md scale-105"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="relative z-10">My Forms</span>
              {activeTab === "myForms" && (
                <span className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("quizHub")}
              className={`relative px-6 py-3 font-semibold text-lg rounded-full transition-all duration-300 transform ${
                activeTab === "quizHub"
                  ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-md scale-105"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="relative z-10">Form Hub</span>
              {activeTab === "quizHub" && (
                <span className="absolute inset-0 rounded-full bg-purple-500 opacity-20 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        {/* My Forms Tab */}
        {activeTab === "myForms" && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 w-full md:w-auto"
                onClick={handleGeneralFormClick}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900">Create a New Form</h3>
                    <p className="text-sm text-gray-600">Start building a new blank form from scratch</p>
                  </div>
                </div>
              </div>

              {/* Search and filter section */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    {viewMode === "grid" ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      <SlidersHorizontal className="h-5 w-5" />
                    </button>
                    
                    {isFilterOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-10 p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Sort by</h4>
                        <div className="space-y-2 mb-4">
                          {["newest", "oldest", "alphabetical"].map((option) => (
                            <div key={option} className="flex items-center">
                              <input
                                type="radio"
                                id={option}
                                name="sortBy"
                                checked={sortBy === option}
                                onChange={() => setSortBy(option)}
                                className="h-4 w-4 text-blue-600"
                              />
                              <label htmlFor={option} className="ml-2 text-sm text-gray-700 capitalize">
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                        
                        <h4 className="font-medium text-gray-700 mb-2">Category</h4>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="all"
                              name="category"
                              checked={selectedCategory === "all"}
                              onChange={() => setSelectedCategory("all")}
                              className="h-4 w-4 text-blue-600"
                            />
                            <label htmlFor="all" className="ml-2 text-sm text-gray-700">
                              All categories
                            </label>
                          </div>
                          {categories.map((category) => (
                            <div key={category} className="flex items-center">
                              <input
                                type="radio"
                                id={category}
                                name="category"
                                checked={selectedCategory === category}
                                onChange={() => setSelectedCategory(category)}
                                className="h-4 w-4 text-blue-600"
                              />
                              <label htmlFor={category} className="ml-2 text-sm text-gray-700 capitalize">
                                {category}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
              Your Forms
            </h2>
            
            {userForms.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <img 
                  src="/api/placeholder/200/200" 
                  alt="No forms" 
                  className="mx-auto mb-4" 
                />
                <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
                <p className="text-gray-500 mb-6">Create your first form to get started!</p>
                <button
                  onClick={handleGeneralFormClick}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center mx-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Form
                </button>
              </div>
            ) : (
              <>
                {filteredAndSortedForms.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No matching forms</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredAndSortedForms.map((form) => {
                        const { id, formImage, formTitle, formDescription, createdAt, category } = form;
                        const isHovered = hoveredFormId === id;
                        
                        return (
                          <div
                            key={id}
                            className="relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
                            onMouseEnter={() => setHoveredFormId(id)}
                            onMouseLeave={() => setHoveredFormId(null)}
                          >
                            {/* Form header/image */}
                            <div 
                              className={`h-32 w-full flex items-center justify-center cursor-pointer ${
                                formImage ? "" : `bg-gradient-to-r ${getRandomAccentColor(id)}`
                              }`}
                              onClick={() => navigate(`/forms/${id}`)}
                            >
                              {formImage ? (
                                <img
                                  src={formImage}
                                  alt={formTitle || "Form"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="h-12 w-12 text-white" />
                              )}
                              
                              {/* Quick action buttons on hover */}
                              <div 
                                className={`absolute top-2 right-2 flex items-center space-x-2 transition-all duration-200 ${
                                  isHovered ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-2"
                                }`}
                              >
                                <div className="relative group/button">
                                  <QuickActionButton
                                    icon={<Eye className="h-4 w-4" />}
                                    label="Preview"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/quiz-overview/${id}`);
                                    }}
                                  />
                                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-200">
                                    Preview
                                  </div>
                                </div>
                                <div className="relative group/button">
                                  <QuickActionButton
                                    icon={<Edit className="h-4 w-4" />}
                                    label="Edit"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/forms/${id}`);
                                    }}
                                  />
                                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-200">
                                    Edit
                                  </div>
                                </div>
                                <div className="relative group/button">
                                  <QuickActionButton
                                    icon={<Trash className="h-4 w-4" />}
                                    label="Delete"
                                    color="bg-red-100 hover:bg-red-200 text-red-700"
                                    onClick={(e) => handleDelete(e, id)}
                                  />
                                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover/button:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-200">
                                    Delete
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Form content */}
                            <div className="p-4 cursor-pointer" onClick={() => navigate(`/forms/${id}`)}>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                                  {formTitle || "Untitled Form"}
                                </h3>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10">
                                {formDescription || "No description."}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(category)}`}>
                                  {category ? category.charAt(0).toUpperCase() + category.slice(1) : "Other"}
                                </span>
                                
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {createdAt?.toDate
                                    ? new Date(createdAt.toDate()).toLocaleDateString()
                                    : new Date(createdAt).toLocaleDateString() || "N/A"}
                                </span>
                              </div>
                            </div>
                            
                            {/* Card footer */}
                            <div className="bg-gray-50 p-3 flex justify-between items-center">
                              <button 
                                className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors duration-200 flex items-center"
                                onClick={() => navigate(`/forms/${id}`)}
                              >
                                Edit <Edit className="h-3 w-3 ml-1" />
                              </button>
                              
                              <button
                                className="text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors duration-200 flex items-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Add share functionality
                                  addToast("Share feature coming soon", "info");
                                }}
                              >
                                Share <Share2 className="h-3 w-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAndSortedForms.map((form) => {
                        const { id, formImage, formTitle, formDescription, createdAt, category } = form;
                        
                        return (
                          <div
                            key={id}
                            className="relative bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                            onMouseEnter={() => setHoveredFormId(id)}
                            onMouseLeave={() => setHoveredFormId(null)}
                          >
                            <div className="flex items-start space-x-4">
                              <div 
                                className={`w-24 h-24 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  formImage ? "" : `bg-gradient-to-r ${getRandomAccentColor(id)}`
                                }`}
                                onClick={() => navigate(`/forms/${id}`)}
                              >
                                {formImage ? (
                                  <img
                                    src={formImage}
                                    alt={formTitle || "Form"}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <FileText className="h-8 w-8 text-white" />
                                )}
                              </div>
                              
                              <div className="flex-1" onClick={() => navigate(`/forms/${id}`)}>
                                <div className="flex justify-between">
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {formTitle || "Untitled Form"}
                                  </h3>
                                  
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(category)}`}>
                                    {category ? category.charAt(0).toUpperCase() + category.slice(1) : "Other"}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 my-2 line-clamp-2">
                                  {formDescription || "No description."}
                                </p>
                                
                                <p className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {createdAt?.toDate
                                    ? new Date(createdAt.toDate()).toLocaleString()
                                    : new Date(createdAt).toLocaleString() || "N/A"}
                                </p>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="relative group">
                                  <button
                                    onClick={() => navigate(`/forms/${id}`)}
                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full text-blue-600 transition-colors duration-200"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </button>
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-200">Edit</div>
                                </div>
                                
                                <div className="relative group">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/quiz-overview/${id}`);
                                    }}
                                    className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-full text-indigo-600 transition-colors duration-200"
                                  >
                                    <Eye className="h-5 w-5" />
                                  </button>
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-200">Preview</div>
                                </div>
                                
                                <div className="relative group">
                                  <button
                                    onClick={(e) => handleDelete(e, id)}
                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors duration-200"
                                  >
                                    <Trash className="h-5 w-5" />
                                  </button>
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-200">Delete</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}

        {/* Form Hub Tab */}
        {activeTab === "quizHub" && (
          <Store 
            userForms={userForms}
            onUseTemplate={handleUseTemplate}
            maxUserForms={3}
            addToast={addToast}
          />
        )}
      </div>

      {/* Floating Create Form Button */}
      {activeTab === "myForms" && (
        <div className="fixed bottom-8 right-12 z-50 group">
          <button
            onClick={handleGeneralFormClick}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            aria-label="Create new form"
          >
            <Plus className="h-8 w-8" />
          </button>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black text-white text-sm font-medium px-3 py-2 rounded-lg mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Create New Form
          </div>
        </div>
      )}

      {/* CSS for tooltips */}
      <style jsx>{`
        .tooltip-container {
          position: relative;
        }
        .tooltip {
          visibility: hidden;
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          text-align: center;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .tooltip-container:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Home;