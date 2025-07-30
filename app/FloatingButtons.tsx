"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Globe } from "lucide-react";

const FloatingButtons = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isHotelSiteOpen, setIsHotelSiteOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    
    // Replace with your actual URLs
    const streamlitUrl = "https://hotelmate-chatbot.streamlit.app/";
    const hotelWebsiteUrl = "https://hotelmate.vercel.app/";

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Don't render anything during SSR
    if (!isClient) {
        return null;
    }

    // Check if we're in an iframe (only in client)
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    // Don't render if we're inside an iframe
    if (isInIframe) {
        return null;
    }

    const toggleChatbot = () => {
        setIsChatOpen(!isChatOpen);
        if (isHotelSiteOpen) {
            setIsHotelSiteOpen(false);
        }
    };

    const toggleHotelSite = () => {
        setIsHotelSiteOpen(!isHotelSiteOpen);
        if (isChatOpen) {
            setIsChatOpen(false);
        }
    };

    return (
        <>
            {/* Hotel Website Button */}
            <button
                onClick={toggleHotelSite}
                className={`fixed bottom-24 right-6 z-50 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 ${
                    isHotelSiteOpen || isChatOpen ? 'scale-0' : 'scale-100'
                }`}
                aria-label="Open Hotel Website"
            >
                <Globe size={20} />
            </button>

            {/* Chatbot Button */}
            <button
                onClick={toggleChatbot}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 ${
                    isChatOpen || isHotelSiteOpen ? 'scale-0' : 'scale-100'
                }`}
                aria-label="Open HoteMate Assistant"
            >
                <MessageCircle size={24} />
            </button>

            {/* Hotel Website Iframe Container - Desktop */}
            <div
                className={`fixed bottom-6 right-6 z-50 transition-all duration-300 hidden lg:block ${
                    isHotelSiteOpen 
                        ? 'w-96 h-[600px] opacity-100 scale-100' 
                        : 'w-0 h-0 opacity-0 scale-0'
                }`}
            >
                <div className="relative w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden border">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        <h3 className="font-semibold text-lg">🏨 Hotel Website</h3>
                        <button
                            onClick={toggleHotelSite}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Close hotel website"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Iframe Container */}
                    <div className="w-full h-[calc(100%-64px)]">
                        {isHotelSiteOpen && (
                            <iframe
                                src={hotelWebsiteUrl}
                                className="w-full h-full border-0"
                                title="Hotel Website"
                                loading="lazy"
                                allow="camera; microphone; geolocation"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Chatbot Iframe Container - Desktop */}
            <div
                className={`fixed bottom-6 right-6 z-50 transition-all duration-300 hidden lg:block ${
                    isChatOpen 
                        ? 'w-96 h-[600px] opacity-100 scale-100' 
                        : 'w-0 h-0 opacity-0 scale-0'
                }`}
            >
                <div className="relative w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden border">
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
                        {isChatOpen && (
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

            {/* Mobile Overlay Background */}
            {(isChatOpen || isHotelSiteOpen) && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
                    onClick={() => {
                        setIsChatOpen(false);
                        setIsHotelSiteOpen(false);
                    }} 
                />
            )}

            {/* Mobile Full Screen Hotel Website */}
            <div
                className={`fixed inset-4 z-50 lg:hidden transition-all duration-300 ${
                    isHotelSiteOpen 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-0 pointer-events-none'
                }`}
            >
                <div className="relative w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                        <h3 className="font-semibold text-lg">🏨 Hotel Website</h3>
                        <button
                            onClick={toggleHotelSite}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Close hotel website"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Mobile Iframe */}
                    <div className="w-full h-[calc(100%-64px)]">
                        {isHotelSiteOpen && (
                            <iframe
                                src={hotelWebsiteUrl}
                                className="w-full h-full border-0"
                                title="Hotel Website"
                                loading="lazy"
                                allow="camera; microphone; geolocation"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Full Screen Chatbot */}
            <div
                className={`fixed inset-4 z-50 lg:hidden transition-all duration-300 ${
                    isChatOpen 
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
                        {isChatOpen && (
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

export default FloatingButtons;