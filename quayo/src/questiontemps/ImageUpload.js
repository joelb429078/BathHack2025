import React, { useState, useCallback } from "react";
import BaseDraggable from "./BaseDraggable";
import { Camera, ImagePlus, Trash2, Crop } from "lucide-react";
import Cropper from "react-easy-crop";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from "../components/Toast"; // Add this import

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = url;
  });

async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const { x, y, width, height } = croppedAreaPixels;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg");
  });
}

const ImageUpload = ({
  id,
  position,
  image,
  width = 160,
  height = 160,
  onDelete,
  setImage,
  setSize,
}) => {
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const { addToast } = useToast(); // Initialize toast hook

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const uploadToFirebase = useCallback(async (blob) => {
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `form-images/${id}_${timestamp}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }, [id]);

  const handleCropImage = useCallback(async () => {
    try {
      if (!localImage) return;
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(localImage, croppedAreaPixels);
      const imageUrl = await uploadToFirebase(croppedBlob);
      setImage(id, imageUrl);
      setShowCropper(false);
      setLocalImage(null);
    } catch (err) {
      console.error("Crop error:", err);
      alert("Failed to crop and upload image");
    } finally {
      setIsUploading(false);
    }
  }, [localImage, croppedAreaPixels, id, setImage, uploadToFirebase]);

  const handleImageUpload = async (e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > maxSize) {
      addToast("Image is too large (max 4MB)", "warning");
      return;
    }

    try {
      setIsUploading(true);
      const localUrl = URL.createObjectURL(file);
      const storageRef = ref(storage, `form-images/${id}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setImage(id, downloadURL);
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const prepareForCropping = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      setLocalImage(localUrl);
      setShowCropper(true);
    } catch (error) {
      console.error("Error preparing image for crop:", error);
      alert("Failed to prepare image for cropping");
    }
  };

  const handleRemoveImage = async (e) => {
    e.stopPropagation();
    if (!image) return;

    try {
      if (image.includes('firebasestorage.googleapis.com')) {
        const imageRef = ref(storage, image);
        await deleteObject(imageRef);
      }
      setImage(id, null);
      setLocalImage(null);
    } catch (error) {
      console.error("Error removing image:", error);
      alert("Failed to remove image");
    }
  };

  const handleResize = (componentId, dimensions) => {
    setSize(id, dimensions);
  };

  const handleClickContainer = (e) => {
    e.stopPropagation();
    if (!image) {
      document.getElementById(`image-input-${id}`).click();
    }
  };

  const cleanupLocalImage = () => {
    if (localImage) {
      URL.revokeObjectURL(localImage);
      setLocalImage(null);
    }
    setShowCropper(false);
  };

  return (
    <>
      <BaseDraggable
        id={id}
        type="image_upload"
        position={position}
        className="group"
        onDelete={onDelete}
        onResize={handleResize}
        style={{ 
          width, 
          height,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none'
        }}
        minWidth={100}
        minHeight={100}
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-gray-200">
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : image ? (
            <>
              <img
                src={image}
                alt="Uploaded"
                className="w-full h-full object-cover pointer-events-none"
              />
              <div
                className="absolute inset-0 flex items-center justify-center
                  bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => document.getElementById(`image-input-${id}`).click()}
                  className="p-2 bg-blue-500 text-white rounded-full mx-1
                    hover:bg-blue-600 transition-colors shadow"
                  title="Change Image"
                >
                  <ImagePlus size={18} />
                </button>
                <button
                  onClick={prepareForCropping}
                  className="p-2 bg-yellow-500 text-white rounded-full mx-1
                    hover:bg-yellow-600 transition-colors shadow"
                  title="Crop Image"
                >
                  <Crop size={18} />
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="p-2 bg-red-500 text-white rounded-full mx-1
                    hover:bg-red-600 transition-colors shadow"
                  title="Remove Image"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </>
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center
                bg-gray-50 border-2 border-dashed border-gray-300 text-gray-400
                group-hover:border-gray-400 group-hover:text-gray-600
                transition-colors cursor-pointer select-none"
              onClick={handleClickContainer}
            >
              <Camera size={32} />
              <span className="text-sm font-medium mt-2">Click to upload</span>
            </div>
          )}

          <input
            type="file"
            id={`image-input-${id}`}
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
        </div>
      </BaseDraggable>

      {showCropper && localImage && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={cleanupLocalImage}
        >
          <div
            className="relative bg-white rounded-lg p-4 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Crop Image</h2>
            <div className="relative w-full h-64 bg-gray-800">
              <Cropper
                image={localImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{ containerStyle: { width: "100%", height: "100%" } }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <label className="text-sm font-medium">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 mx-2"
              />
              <span className="w-12 text-right text-sm font-medium">
                {zoom.toFixed(2)}x
              </span>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={cleanupLocalImage}
                className="px-4 py-2 rounded text-gray-700 hover:bg-gray-100 transition"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleCropImage}
                className="px-4 py-2 rounded bg-blue-600 text-white
                  hover:bg-blue-700 transition disabled:opacity-50"
                disabled={isUploading}
              >
                {isUploading ? 'Saving...' : 'Save Crop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUpload;