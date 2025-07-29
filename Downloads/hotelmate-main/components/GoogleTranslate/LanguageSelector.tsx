"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

declare global {
    interface Window {
        googleTranslateElementInit?: () => void;
        google?: any;
    }
}

interface Language {
    code: string;
    name: string;
    flag: string;
}

const languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
];

const LanguageSelector: React.FC = () => {
    const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);
    const [isTranslateReady, setIsTranslateReady] = useState(false);

    // Clean URL hash function
    const cleanUrlHash = () => {
        if (window.location.hash.includes('googtrans')) {
            const cleanUrl = window.location.href.split('#')[0];
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('✅ URL cleaned:', cleanUrl);
        }
    };

    // Auto-clean URL on page load if hash exists
    useEffect(() => {
        const autoCleanOnLoad = () => {
            if (window.location.hash.includes('googtrans')) {
                console.log('🧹 Found hash on page load, scheduling cleanup');
                
                // Wait for translation to settle, then clean
                setTimeout(cleanUrlHash, 3000);
                // Backup cleanup
                setTimeout(cleanUrlHash, 6000);
            }
        };

        // Clean immediately if page loaded with hash
        autoCleanOnLoad();

        // Also monitor for new hash changes
        const handleHashChange = () => {
            console.log('📍 Hash changed, scheduling cleanup');
            setTimeout(cleanUrlHash, 3000);
        };

        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    // Check if Google Translate is ready
    useEffect(() => {
        const checkTranslateReady = () => {
            if (window.google && window.google.translate) {
                setIsTranslateReady(true);
                console.log('✅ Google Translate ready');
                return true;
            }
            return false;
        };

        if (checkTranslateReady()) return;

        const interval = setInterval(() => {
            if (checkTranslateReady()) clearInterval(interval);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    // Load saved language and detect current state
    useEffect(() => {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
        const lang = languages.find(l => l.code === savedLanguage);
        if (lang) {
            setCurrentLanguage(lang);
        }

        // Check if URL already has translation hash
        const hash = window.location.hash;
        const hashMatch = hash.match(/googtrans\(en\|(\w+)\)/);
        
        if (hashMatch) {
            const currentLangCode = hashMatch[1];
            const detectedLang = languages.find(l => l.code === currentLangCode);
            if (detectedLang) {
                setCurrentLanguage(detectedLang);
                localStorage.setItem('selectedLanguage', currentLangCode);
            }
        }
    }, []);

    const forceTranslation = (languageCode: string) => {
        console.log('🚀 FORCE TRANSLATING TO:', languageCode);
        
        // Update UI and storage immediately
        const selectedLanguage = languages.find(lang => lang.code === languageCode);
        if (selectedLanguage) {
            setCurrentLanguage(selectedLanguage);
            localStorage.setItem('selectedLanguage', languageCode);
        }

        // Method 1: Try combo element first (cleaner, no reload needed)
        const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (combo) {
            console.log('📝 Using combo element (no reload)');
            combo.value = languageCode;
            combo.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Clean URL after translation completes
            setTimeout(cleanUrlHash, 2000);
            setTimeout(cleanUrlHash, 5000); // Backup
            return;
        }

        // Method 2: Hash method with reload (guaranteed to work)
        console.log('🔗 Using hash method (with reload)');
        
        // Store flag that we just triggered translation
        sessionStorage.setItem('justTranslated', 'true');
        
        // Set hash and reload
        window.location.hash = `googtrans(en|${languageCode})`;
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const resetToEnglish = () => {
        console.log('🔄 RESETTING TO ENGLISH');
        
        // Clear all storage
        localStorage.removeItem('googtrans');
        localStorage.removeItem('googtrans/en');
        localStorage.setItem('selectedLanguage', 'en');
        sessionStorage.removeItem('justTranslated');
        
        // Clear cookies
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Navigate to clean URL
        const cleanUrl = window.location.href.split('#')[0];
        window.location.href = cleanUrl;
    };

    const handleLanguageSelect = (languageCode: string) => {
        console.log('🎯 LANGUAGE SELECTED:', languageCode);
        
        if (languageCode === 'en') {
            resetToEnglish();
        } else {
            forceTranslation(languageCode);
        }
    };

    return (
        <div className="relative">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white/90 transition-all duration-200 shadow-lg notranslate"
                        disabled={!isTranslateReady}
                    >
                        <span className="mr-1">{currentLanguage.flag}</span>
                        <span className="hidden sm:inline text-sm">{currentLanguage.name}</span>
                        <span className="sm:hidden text-xs">{currentLanguage.code.toUpperCase()}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    align="end" 
                    className="w-48 max-h-80 overflow-y-auto bg-white/95 backdrop-blur-sm border-white/30 notranslate"
                    sideOffset={8}
                >
                    <div className="p-2">
                        <div className="text-xs text-gray-500 mb-2 px-2">Select Language</div>
                        {languages.map((language) => (
                            <DropdownMenuItem
                                key={language.code}
                                onClick={() => handleLanguageSelect(language.code)}
                                className={`cursor-pointer rounded-md transition-colors ${
                                    currentLanguage.code === language.code 
                                        ? 'bg-primary/10 text-primary font-medium' 
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <span className="mr-3 text-lg">{language.flag}</span>
                                <span className="text-sm">{language.name}</span>
                                {currentLanguage.code === language.code && (
                                    <span className="ml-auto text-primary">✓</span>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                    {!isTranslateReady && (
                        <div className="p-2 text-xs text-gray-500 text-center border-t">
                            Loading translator...
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default LanguageSelector;