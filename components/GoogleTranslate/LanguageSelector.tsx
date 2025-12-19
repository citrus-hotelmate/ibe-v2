"use client";

import React, { useEffect, useState } from 'react';
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();

    // Clean URL hash function (kept for safety, but we now rely mainly on cookies + reload)
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

    // Load saved language preference into UI state
    useEffect(() => {
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
        const lang = languages.find(l => l.code === savedLanguage);
        if (lang) {
            setCurrentLanguage(lang);
        }
    }, []);

    // Helper to apply a given language to the page without forcing a reload
    const applyLanguageWithoutReload = (languageCode: string) => {
        if (!isTranslateReady || languageCode === "en") return;

        const tryApply = () => {
            const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
            if (!combo) return false;

            console.log('🌐 Re-applying saved language via combo:', languageCode);
            combo.value = languageCode;
            combo.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        };

        if (tryApply()) return;

        // If combo isn't ready yet, poll briefly
        const start = Date.now();
        const maxWaitMs = 4000;
        const interval = setInterval(() => {
            if (tryApply()) {
                clearInterval(interval);
                return;
            }
            if (Date.now() - start > maxWaitMs) {
                clearInterval(interval);
                console.warn('⚠️ Could not find .goog-te-combo to re-apply language');
            }
        }, 200);
    };

    // Whenever Google Translate is ready (or route changes), re-apply saved language
    useEffect(() => {
        if (!isTranslateReady) return;

        const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
        applyLanguageWithoutReload(savedLanguage);
    }, [isTranslateReady, pathname]);

    const forceTranslation = (languageCode: string) => {
        console.log('🚀 FORCE TRANSLATING TO:', languageCode);

        // Update UI and storage immediately
        const selectedLanguage = languages.find(lang => lang.code === languageCode);
        if (selectedLanguage) {
            setCurrentLanguage(selectedLanguage);
            localStorage.setItem('selectedLanguage', languageCode);
        }

        // Tell Google Translate which language to use for this and future loads
        document.cookie = `googtrans=/en/${languageCode};path=/;`;

        // Automatically reload so translation applies without the user manually refreshing
        // Small timeout to ensure cookie is written before reload
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

        // Automatically reload to apply reset without manual refresh
        setTimeout(() => {
            window.location.reload();
        }, 100);
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
                        className="bg-white backdrop-blur-sm border-white/30 hover:bg-white/90 transition-all duration-200 shadow-lg notranslate flex items-center justify-center rounded-full w-10 h-10"
                        disabled={!isTranslateReady}
                    >
                        <Globe className="h-4 w-4 text-black" />
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
                                className={`cursor-pointer rounded-md transition-colors ${currentLanguage.code === language.code
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