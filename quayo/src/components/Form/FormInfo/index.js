import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2 } from "lucide-react";
import { useToast } from "../../Toast";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase"; // Make sure this import is correct for your project

const FormInfo = ({ 
  show, 
  onClose,
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formImage,
  setFormImage,
  handleFormImageUpload,
  category,
  onCategoryChange,
  formId
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Handle category change and notify parent
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    console.log("FormInfo - Category before change:", category);
    console.log("FormInfo - Changing category to:", newCategory);
    if (onCategoryChange) {
      onCategoryChange(newCategory);
    }
  };

  // Function to upload image to Firebase Storage
  const uploadImageToFirebase = async (file) => {
    if (!file || !formId) return null;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create a reference to Firebase Storage
      const storageRef = ref(storage, `form-images/${formId}/${file.name}`);
      
      // Upload the file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Return a promise that resolves with the download URL
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            // Handle errors
            setIsUploading(false);
            addToast(`Upload failed: ${error.message}`, "error");
            reject(error);
          },
          async () => {
            // On complete
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              setIsUploading(false);
              resolve(downloadURL);
            } catch (err) {
              setIsUploading(false);
              addToast(`Failed to get download URL: ${err.message}`, "error");
              reject(err);
            }
          }
        );
      });
    } catch (error) {
      setIsUploading(false);
      addToast(`Upload error: ${error.message}`, "error");
      return null;
    }
  };

  // Enhanced image upload handler
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > maxSize) {
      addToast("Image is too large (max 4MB)", "warning");
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      addToast("Only image files are allowed", "warning");
      return;
    }
    
    try {
      // First show a preview from the local file
      const reader = new FileReader();
      reader.onload = () => {
        console.log("FormInfo - Showing image preview");
        setFormImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Then upload to Firebase Storage
      const downloadURL = await uploadImageToFirebase(file);
      if (downloadURL) {
        console.log("FormInfo - Image uploaded to Firebase:", downloadURL);
        setFormImage(downloadURL);
        addToast("Image uploaded successfully", "success");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      addToast("Failed to upload image", "error");
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Handle click on the dropzone
  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center"
          style={{ isolation: "isolate" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, transform: "translate(-50%, -50%)" }} // Include transform in animation
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute top-1/2 left-1/2 w-full max-w-2xl p-6 bg-white rounded-xl shadow-xl space-y-4 z-[100]"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Form Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => {
                    console.log("FormInfo - Changing formTitle to:", e.target.value);
                    setFormTitle(e.target.value);
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter form title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => {
                    console.log("FormInfo - Changing formDescription to:", e.target.value);
                    setFormDescription(e.target.value);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter form description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Category
                </label>
                <select
                  value={category}
                  onChange={onCategoryChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="other">Other</option>
                  <option value="general">General Knowledge</option>
                  <option value="educational">Educational</option>
                  <option value="training">Training</option>
                  <option value="certification">Certification</option>
                  <option value="skillbuilding">Skill-Building</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Image
                </label>

                {formImage ? (
                  <div className="relative w-full h-40 mb-2">
                    <img
                      src={formImage}
                      alt="Form Header"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        console.log("FormInfo - Removing formImage");
                        setFormImage(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 mb-2 transition-colors cursor-pointer ${
                      isDragging ? "border-blue-500 bg-blue-50" : "hover:border-blue-400 hover:bg-gray-50"
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-blue-500 font-medium">
                          Uploading... {Math.round(uploadProgress)}%
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2" />
                        <p className="text-sm font-medium">
                          Drag & drop an image here or click to browse
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 4MB
                        </p>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  id="form-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!formImage && !isUploading && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={isUploading}
                  >
                    Upload Image
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FormInfo;