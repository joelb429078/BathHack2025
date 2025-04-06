import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
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
import {
  FileText,
  Search,
  Filter,
  Grid,
  List,
  Tag,
  Layout,
  Heart,
  BookOpen,
  Award,
  Briefcase,
  Brain,
  GraduationCap,
  HelpCircle,
  Plus,
  Loader,
  Clock,
  Eye,
} from "lucide-react";

const Store = ({
  userForms = [],
  onUseTemplate,
  maxUserForms = 3,
  addToast,
}) => {
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(true);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [featuredQuiz, setFeaturedQuiz] = useState(null);
  const [userLikes, setUserLikes] = useState({});
  const [isLikeAnimating, setIsLikeAnimating] = useState({});

  // Categories definition
  const categories = [
    { id: "all", name: "All", icon: <Layout size={16} /> },
    { id: "general", name: "General Knowledge", icon: <BookOpen size={16} /> },
    { id: "educational", name: "Educational", icon: <GraduationCap size={16} /> },
    { id: "training", name: "Training", icon: <Briefcase size={16} /> },
    { id: "certification", name: "Certification", icon: <Award size={16} /> },
    { id: "skillbuilding", name: "Skill-Building", icon: <Brain size={16} /> },
    { id: "other", name: "Other", icon: <HelpCircle size={16} /> },
  ];

  // Fetch all templates
  useEffect(() => {
    const fetchAllQuizzes = () => {
      setLoading(true);
      try {
        const formsRef = collection(db, "forms");
        const unsubscribe = onSnapshot(formsRef, async (querySnapshot) => {
          const quizzesArray = [];
          const likesData = {};

          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            
            // Only show approved templates (or templates without status, which are considered approved)
            if (data.status && data.status !== 'approved') {
              continue;
            }
            
            const quiz = {
              ...data,
              id: docSnap.id,
              category: data.category || "other",
              likes: data.likes || 0,
              featured: data.featured || Math.random() > 0.9,
            };
            
            quizzesArray.push(quiz);

            if (auth.currentUser) {
              const likeRef = doc(db, "forms", quiz.id, "likes", auth.currentUser.uid);
              const likeSnap = await getDoc(likeRef);
              likesData[quiz.id] = likeSnap.exists();
            }
          }

          const featured = quizzesArray.find((quiz) => quiz.featured) || 
                          (quizzesArray.length > 0 ? quizzesArray[0] : null);
          
          setFeaturedQuiz(featured);
          setAllQuizzes(quizzesArray);
          setUserLikes(likesData);
          
          // Apply filters
          applyFilters(quizzesArray, searchTerm, categoryFilter, sortBy);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching all quizzes:", error);
          if (addToast) {
            addToast("Failed to load Quiz Hub", "error");
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up quizzes listener:", error);
        if (addToast) {
          addToast("Failed to load Quiz Hub", "error");
        }
        setLoading(false);
      }
    };

    fetchAllQuizzes();
  }, [addToast]);

  // Apply filters when parameters change
  useEffect(() => {
    applyFilters(allQuizzes, searchTerm, categoryFilter, sortBy);
  }, [searchTerm, categoryFilter, sortBy, allQuizzes]);

  // Filter function
  const applyFilters = (quizzes, search, category, sort) => {
    let result = quizzes.filter((quiz) => {
      const matchesSearch = search === '' ? true : 
                          (quiz.formTitle || "Untitled Form").toLowerCase().includes(search.toLowerCase()) ||
                          (quiz.formDescription || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = category === 'all' ? true : quiz.category === category;
      
      return matchesSearch && matchesCategory;
    });

    switch (sort) {
      case "newest":
        result.sort((a, b) => {
          const dateA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        break;
      case "rating":
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }

    setFilteredQuizzes(result);
  };

  // Handle like/unlike
  const handleLike = async (quizId) => {
    if (!auth.currentUser) {
      if (addToast) {
        addToast("Please sign in to like this quiz", "error");
      }
      navigate("/login");
      return;
    }

    const userId = auth.currentUser.uid;
    const likeRef = doc(db, "forms", quizId, "likes", userId);
    const formRef = doc(db, "forms", quizId);

    try {
      const likeSnap = await getDoc(likeRef);
      const formSnap = await getDoc(formRef);
      if (!formSnap.exists()) throw new Error("Form not found");

      const currentLikes = formSnap.data().likes || 0;
      let newLikes;

      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
        newLikes = Math.max(currentLikes - 1, 0);
        await updateDoc(formRef, { likes: newLikes });
        setUserLikes((prev) => ({ ...prev, [quizId]: false }));
      } else {
        await setDoc(likeRef, { likedAt: new Date() });
        newLikes = currentLikes + 1;
        await updateDoc(formRef, { likes: newLikes });
        setUserLikes((prev) => ({ ...prev, [quizId]: true }));
      }

      // Trigger like animation
      setIsLikeAnimating((prev) => ({ ...prev, [quizId]: true }));
      setTimeout(() => {
        setIsLikeAnimating((prev) => ({ ...prev, [quizId]: false }));
      }, 1000);

      // Update the lists
      setAllQuizzes((prevQuizzes) =>
        prevQuizzes.map((quiz) =>
          quiz.id === quizId ? { ...quiz, likes: newLikes } : quiz
        )
      );
      setFilteredQuizzes((prevFiltered) =>
        prevFiltered.map((quiz) =>
          quiz.id === quizId ? { ...quiz, likes: newLikes } : quiz
        )
      );
      if (featuredQuiz && featuredQuiz.id === quizId) {
        setFeaturedQuiz((prev) => ({ ...prev, likes: newLikes }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      if (addToast) {
        addToast("Failed to toggle like", "error");
      }
    }
  };

  // Handle using template
  const handleUseTemplate = async (quiz) => {
    if (!auth.currentUser) {
      if (addToast) {
        addToast("Please sign in to add this quiz", "error");
      }
      navigate("/login");
      return;
    }

    if (userForms.length >= maxUserForms) {
      if (addToast) {
        addToast(`Maximum of ${maxUserForms} forms reached!`, "warning");
      }
      return;
    }

    onUseTemplate?.(quiz);
  };

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader className="h-10 w-10 text-purple-500 animate-spin mb-4" />
      <p className="text-gray-600 font-medium">Loading templates...</p>
    </div>
  );

  // Empty State Component
  const EmptyState = () => (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        No Templates Found
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {searchTerm
          ? `No templates match "${searchTerm}"`
          : `No templates found in the selected category`}
      </p>
      <button
        onClick={() => {
          setSearchTerm("");
          setCategoryFilter("all");
        }}
        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );

  return (
    <div>
      {/* Hub Title */}
      <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
        Form Hub
      </h2>

      {/* Featured Template */}
      {!loading && featuredQuiz && (
        <div className="mb-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl overflow-hidden shadow-lg">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center">
            <div className="md:w-3/5 text-white mb-6 md:mb-0 md:pr-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-25 text-white text-sm font-medium mb-4">
                <Heart className="h-4 w-4 mr-1 text-red-300" />
                Featured Template
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {featuredQuiz.formTitle || "Untitled Form"}
              </h3>
              <p className="mb-4 opacity-90">
                {featuredQuiz.formDescription || "A premium form template ready for you to use and customize."}
              </p>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => handleLike(featuredQuiz.id)}
                  className="flex items-center text-white hover:text-red-300 transition-colors duration-200"
                >
                  <Heart
                    className={`h-4 w-4 mr-1 ${
                      userLikes[featuredQuiz.id] ? "fill-current text-red-300" : ""
                    } ${isLikeAnimating[featuredQuiz.id] ? "animate-like" : ""}`}
                  />
                  <span>{featuredQuiz.likes} likes</span>
                </button>
              </div>
              <button
                onClick={() => handleUseTemplate(featuredQuiz)}
                className="bg-white text-purple-700 px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
              >
                Use This Template
              </button>
            </div>
            <div className="md:w-2/5">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                  {featuredQuiz.formImage ? (
                    <img
                      src={featuredQuiz.formImage}
                      alt="Template preview"
                      className="object-cover w-full h-full rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="capitalize">{featuredQuiz.category}</span>
                  <span>
                    {featuredQuiz.questions?.length || 
                      Math.floor(Math.random() * 10) + 5} questions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter & Sort */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Tag className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="newest">Newest</option>
                <option value="rating">Most Liked</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex justify-end items-center space-x-2">
            <span className="text-sm text-gray-500 mr-2">View:</span>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${
                viewMode === "grid"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${
                viewMode === "list"
                  ? "bg-purple-100 text-purple-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="mt-4 hidden md:flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === category.id
                  ? "bg-purple-100 text-purple-700 border-purple-200 border"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 border"
              }`}
            >
              <span className="mr-1.5">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredQuizzes.length} templates
            {categoryFilter !== "all" && ` in ${categories.find((c) => c.id === categoryFilter)?.name}`}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredQuizzes.length === 0 ? (
        <EmptyState />
      ) : viewMode === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group card-uniform"
            >
              {/* Image Section */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative overflow-hidden min-h-[160px]">
                {quiz.formImage ? (
                  <img
                    src={quiz.formImage}
                    alt={quiz.formTitle || "Template"}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-50 to-indigo-50 min-h-[160px]">
                    {categories.find((c) => c.id === quiz.category)?.icon ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-purple-300 mb-2 transform scale-150">
                          {categories.find((c) => c.id === quiz.category)?.icon}
                        </div>
                        <span className="text-xs text-purple-400 font-medium capitalize">
                          {quiz.category}
                        </span>
                      </div>
                    ) : (
                      <FileText className="h-12 w-12 text-purple-200" />
                    )}
                  </div>
                )}
                
                {/* Featured Badge */}
                {quiz.featured && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Featured
                    </span>
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 text-purple-700 text-xs px-2 py-1 rounded-full font-medium capitalize">
                    {quiz.category}
                  </span>
                </div>
                
                {/* Hover Actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                  <div className="flex flex-wrap justify-center gap-2 max-w-[90%]">
                    <button
                      onClick={() => navigate(`/quiz-overview/${quiz.id}`)}
                      className="bg-white text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-50 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleUseTemplate(quiz)}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-2 h-12">
                  {quiz.formTitle || "Untitled Template"}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2 h-10">
                  {quiz.formDescription || "No description available."}
                </p>

                {/* Stats */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleLike(quiz.id)}
                    className="flex items-center text-gray-500 hover:text-red-500 transition-colors duration-200"
                  >
                    <Heart
                      className={`h-4 w-4 mr-1 ${
                        userLikes[quiz.id] ? "fill-current text-red-500" : ""
                      } ${isLikeAnimating[quiz.id] ? "animate-like" : ""}`}
                    />
                    <span>{quiz.likes}</span>
                  </button>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>
                      {quiz.createdAt?.toDate
                        ? quiz.createdAt.toDate().toLocaleDateString()
                        : "Recently added"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex"
            >
              {/* Image */}
              <div className="w-32 h-32 bg-gray-100 relative flex-shrink-0">
                {quiz.formImage ? (
                  <img
                    src={quiz.formImage}
                    alt={quiz.formTitle || "Template"}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-50 to-indigo-50">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-purple-300 mb-1">
                        {categories.find((c) => c.id === quiz.category)?.icon || <FileText className="h-8 w-8" />}
                      </div>
                      <span className="text-xs text-purple-400 font-medium capitalize">
                        {quiz.category}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Featured Badge */}
                {quiz.featured && (
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-sm font-medium">
                      Featured
                    </span>
                  </div>
                )}
                
                <div className="absolute top-2 left-2">
                  <span className="bg-white/90 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium capitalize">
                    {quiz.category}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900">{quiz.formTitle || "Untitled Template"}</h3>
                    
                    <button
                      onClick={() => handleLike(quiz.id)}
                      className="flex items-center text-gray-500 hover:text-red-500 transition-colors duration-200"
                    >
                      <Heart
                        className={`h-4 w-4 mr-1 ${
                          userLikes[quiz.id] ? "fill-current text-red-500" : ""
                        } ${isLikeAnimating[quiz.id] ? "animate-like" : ""}`}
                      />
                      <span>{quiz.likes}</span>
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {quiz.formDescription || "No description available."}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">
                      {quiz.createdAt?.toDate
                        ? quiz.createdAt.toDate().toLocaleDateString()
                        : "Recently added"}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 mt-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/quiz-overview/${quiz.id}`)}
                    className="text-sm text-purple-600 hover:text-purple-800 px-3 py-1 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    Preview
                  </button>
                  
                  <button
                    onClick={() => handleUseTemplate(quiz)}
                    className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-md hover:bg-purple-200 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Form Template CTA */}
      {!loading && (
        <div className="mt-10 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm border border-purple-100">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Have a great form to share?
              </h3>
              <p className="text-gray-600">
                Submit your form to the community hub and help others create amazing content
              </p>
            </div>
            <button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all duration-300">
              <Plus className="h-5 w-5 mr-2" />
              Submit Your Form
            </button>
          </div>
        </div>
      )}

      {/* CSS for Like Animation */}
      <style jsx>{`
        @keyframes likeAnimation {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-like {
          animation: likeAnimation 0.6s ease-in-out;
        }
        .card-uniform {
          height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .card-uniform .aspect-w-16 {
          flex-shrink: 0;
          height: 200px;
        }
        .card-uniform .p-4 {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
};

export default Store;