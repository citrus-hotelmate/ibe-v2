import { useEffect, useRef, useState } from 'react';

interface HotelMapProps {
    latitude: string;
    longitude: string;
    hotelName: string;
}

// Safe typing for window with Google Maps
declare global {
    interface Window {
        initMap: () => void;
    }
}

const HotelMap = ({ latitude, longitude, hotelName }: HotelMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        // Default to a location if coordinates are not provided
        const lat = latitude && latitude !== "" ? parseFloat(latitude) : 7.9519;  // Default to Sigiriya, Sri Lanka
        const lng = longitude && longitude !== "" ? parseFloat(longitude) : 80.7554;

        // Safe check if Google Maps is already loaded
        const isGoogleMapsLoaded = () => {
            return window.google && window.google.maps;
        };

        // Function to initialize the map
        const initializeMap = () => {
            if (!mapRef.current) return;

            try {
                // Make sure google and maps are defined
                if (!window.google || !window.google.maps) return;

                // Create map with simple options
                const map = new window.google.maps.Map(mapRef.current, {
                    center: { lat, lng },
                    zoom: 14,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false
                });

                // Add marker
                new window.google.maps.Marker({
                    position: { lat, lng },
                    map,
                    title: hotelName
                });

                setMapLoaded(true);
            } catch (error) {
                console.error("Error initializing Google Map:", error);
            }
        };

        // Check if we already have Google Maps loaded
        if (isGoogleMapsLoaded()) {
            initializeMap();
            return;
        }

        // If not loaded, add the script
        window.initMap = initializeMap;

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            // Cleanup
            if (window.initMap) {
                window.initMap = () => { };
            }

            // Remove script if it was added by this component
            const scriptElement = document.getElementById('google-maps-script');
            if (scriptElement && scriptElement.parentNode) {
                scriptElement.parentNode.removeChild(scriptElement);
            }
        };
    }, [latitude, longitude, hotelName, apiKey]);

    return (
        <>
            {!mapLoaded && (
                <div className="flex items-center justify-center w-full h-full bg-slate-100 rounded-[2.5rem]">
                    <div className="animate-pulse text-slate-400">Loading map...</div>
                </div>
            )}
            <div ref={mapRef} className="w-full h-full rounded-[2.5rem]" style={{ minHeight: "100%" }}></div>
        </>
    );
};

export default HotelMap;
