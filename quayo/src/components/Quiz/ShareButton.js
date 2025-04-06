// src/components/Quiz/ShareButton.js
import React, { useState } from 'react';
import { Share2, Copy, Check } from "lucide-react";

const ShareButton = () => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Quiz Session",
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== "AbortError") console.error("Error sharing:", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        style={{ animation: copied ? "pulse 1s" : "" }}
      >
        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
        <span className="text-sm font-medium">{copied ? "Copied!" : "Copy Link"}</span>
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Share2 size={18} />
        <span className="text-sm font-medium">Share</span>
      </button>
    </div>
  );
};

export default ShareButton;