"use client";

import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

interface ChatbotIframeProps {
  streamlitUrl?: string;
}

export const ChatbotIframe: React.FC<ChatbotIframeProps> = ({ 
  streamlitUrl = "https://your-streamlit-app.streamlit.app" // Replace with your actual Streamlit URL
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Open chatbot"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chatbot Iframe Container */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen 
            ? 'w-96 h-[600px] opacity-100 scale-100' 
            : 'w-0 h-0 opacity-0 scale-0'
        }`}
      >
        <div className="relative w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <h3 className="font-semibold text-lg">🤖 HoteMate Assistant</h3>
            <button
              onClick={toggleChatbot}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Iframe Container */}
          <div className="w-full h-[calc(100%-64px)]">
            {isOpen && (
              <iframe
                src={streamlitUrl}
                className="w-full h-full border-0"
                title="HoteMate Chatbot"
                loading="lazy"
                allow="camera; microphone; geolocation"
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Responsive Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleChatbot} />
      )}

      {/* Mobile Full Screen on Small Devices */}
      <div
        className={`fixed inset-4 z-50 lg:hidden transition-all duration-300 ${
          isOpen 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-0 pointer-events-none'
        }`}
      >
        <div className="relative w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <h3 className="font-semibold text-lg">🤖 HoteMate Assistant</h3>
            <button
              onClick={toggleChatbot}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Iframe */}
          <div className="w-full h-[calc(100%-64px)]">
            {isOpen && (
              <iframe
                src={streamlitUrl}
                className="w-full h-full border-0"
                title="HoteMate Chatbot"
                loading="lazy"
                allow="camera; microphone; geolocation"
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};