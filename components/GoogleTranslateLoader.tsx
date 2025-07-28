"use client";
import { useEffect } from "react";

export function GoogleTranslateLoader() {
  useEffect(() => {
    if (!localStorage.getItem("selectedLanguage")) {
      localStorage.setItem("selectedLanguage", "en");
    }
    // Force the googtrans cookie to match the selected language
    const selectedLang = localStorage.getItem("selectedLanguage") || "en";
    document.cookie = `googtrans=/en/${selectedLang}; path=/; domain=${window.location.hostname}`;
    const insertScript = (src: string) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    (window as any).googleTranslateElementInit = function () {
      const tryInit = () => {
        if ((window as any).google?.translate?.TranslateElement) {
          new (window as any).google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,de,it,pt,ru,ja,ko,zh,ar,hi,th,vi,nl,sv,si',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE || 0,
            autoDisplay: false
          }, 'google_translate_element');
        } else {
          setTimeout(tryInit, 100);
        }
      };
      tryInit();
    };

    insertScript("https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit");

    const removeGoogleTranslateBar = () => {
      const interval = setInterval(() => {
        const frame = document.querySelector('iframe.goog-te-banner-frame');
        if (frame?.parentNode) frame.parentNode.removeChild(frame);
        const container = document.querySelector('.goog-te-banner-frame.skiptranslate');
        if (container?.parentNode) container.parentNode.removeChild(container);
        const body = document.querySelector('body');
        if (body) body.style.top = '0px';
      }, 500);
      setTimeout(() => clearInterval(interval), 10000);
    };

    if (document.readyState !== "loading") {
      removeGoogleTranslateBar();
    } else {
      document.addEventListener("DOMContentLoaded", removeGoogleTranslateBar);
    }

    window.addEventListener("load", removeGoogleTranslateBar);

    // --- Begin Language Change Observer and Handler ---
    const handleLanguageChange = () => {
      const lang = document.documentElement.lang || 'en';
      localStorage.setItem("selectedLanguage", lang);
    };

    const observer = new MutationObserver(() => {
      const iframe = document.querySelector("iframe.goog-te-menu-frame");
      if (iframe) {
        const iframeDoc = (iframe as HTMLIFrameElement).contentDocument || (iframe as HTMLIFrameElement).contentWindow?.document;
        if (!iframeDoc) return;

        iframeDoc.querySelectorAll(".goog-te-menu2-item span.text").forEach(span => {
          span.addEventListener("click", () => {
            setTimeout(() => {
              const lang = document.cookie
                .split('; ')
                .find(row => row.startsWith('googtrans='))
                ?.split('=')[1]
                ?.split('/')[2] || 'en';
              localStorage.setItem("selectedLanguage", lang);
            }, 100);
          });
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
    // --- End Language Change Observer and Handler ---
  }, []);

  return <div id="google_translate_element"></div>;
}