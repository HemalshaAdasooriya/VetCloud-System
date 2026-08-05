import { Badge, Button, Card, Input } from "../components/Ui/ui";
import ClinicMap from "./ClinicMap";
import Navigation from "../layouts/navigation";
import { Clock, Filter, MapPin, Navigation2, PhoneCall, Search, Star, LocateFixed, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { IoNavigateOutline } from "react-icons/io5";


export default function UserClinics() {
    const [showMobileMap, setShowMobileMap] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const userLocationRef = useRef(null);

    useEffect(() => {
        userLocationRef.current = userLocation;
    }, [userLocation]);
    const [googleFallback, setGoogleFallback] = useState(null);
    const [searchedRadius, setSearchedRadius] = useState(null);

    // Manual location search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [manualLocation, setManualLocation] = useState(null);
    const [sidebarWidth, setSidebarWidth] = useState(320); // Default matches your original md:w-[320px]
    const [isResizing, setIsResizing] = useState(false);

    const searchRef = useRef(null);
    const debounceRef = useRef(null);
    const dragStart = useRef({ x: 0, width: 320 });

    // Fetch nearby clinics via Google Places (backend proxy) 
    const fetchNearbyClinics = useCallback(async (lat, lng) => {
        setLoading(true);
        setClinics([]);
        setGoogleFallback(null);
        setSearchedRadius(null);

        try {
            // Calls your backend proxy → backend calls Google Places API
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/map/places?lat=${lat}&lng=${lng}`
            );

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const data = await res.json();

            if (data.status === "REQUEST_DENIED" || data.status === "INVALID_REQUEST") {
                console.error("Google API error:", data.error_message);
                setGoogleFallback(
                    `https://www.google.com/maps/search/veterinary+clinic/@${lat},${lng},13z`
                );
                return;
            }

            // New Places API format
            const found = (data.places || [])
                .map((place) => {
                    const pLat = place.location.latitude;
                    const pLng = place.location.longitude;
                    const originLat = userLocationRef.current ? userLocationRef.current.lat : lat;
                    const originLng = userLocationRef.current ? userLocationRef.current.lng : lng;
                    const R = 6371;
                    const dLat = ((pLat - originLat) * Math.PI) / 180;
                    const dLon = ((pLng - originLng) * Math.PI) / 180;
                    const a =
                        Math.sin(dLat / 2) ** 2 +
                        Math.cos((originLat * Math.PI) / 180) *
                        Math.cos((pLat * Math.PI) / 180) *
                        Math.sin(dLon / 2) ** 2;
                    const dist = (
                        R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                    ).toFixed(1);

                    return {
                        id: place.id,
                        name: place.displayName?.text || "Unnamed Clinic",
                        address: place.formattedAddress || "Address not available",
                        phone: place.nationalPhoneNumber || null,
                        hours: place.currentOpeningHours?.openNow !== undefined
                            ? place.currentOpeningHours.openNow
                                ? "Open Now"
                                : "Closed Now"
                            : "Hours not listed",
                        type: "Veterinary Clinic",
                        open: place.currentOpeningHours?.openNow ?? true,
                        rating: place.rating || null,
                        reviews: place.userRatingCount || null,
                        lat: pLat,
                        lng: pLng,
                        distance: dist,
                        foundWithin: dist,
                    };
                })
                .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            if (found.length === 0) {
                setGoogleFallback(
                    `https://www.google.com/maps/search/veterinary+clinic/@${lat},${lng},13z`
                );
            }

            setClinics(found);
        } catch (err) {
            console.error("Failed to fetch clinics:", err);
            setGoogleFallback(
                `https://www.google.com/maps/search/veterinary+clinic/@${lat},${lng},13z`
            );
        } finally {
            setLoading(false);
        }
    }, []);

    //  Search places via backend proxy 
    const searchPlaces = async (query) => {
        if (!query || query.trim().length < 3) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setSearchLoading(true);
        try {
            // calls backend proxy instead of Nominatim directly
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/map/search?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) throw new Error("Search error");
            const data = await res.json();
            setSearchResults(data);
            setShowDropdown(data.length > 0);
        } catch (err) {
            console.error("Place search failed:", err);
            setSearchResults([]);
            setShowDropdown(false);
        } finally {
            setSearchLoading(false);
        }
    };

    // Debounced search input 
    const handleSearchInput = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        clearTimeout(debounceRef.current);
        if (!val || val.trim().length < 3) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        debounceRef.current = setTimeout(() => searchPlaces(val), 400);
    };

    //  Pick a place from dropdown 
    const handleSelectPlace = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        const label = place.display_name.split(",").slice(0, 2).join(", ");
        setManualLocation({ lat, lng, label });
        setSearchQuery(label);
        setShowDropdown(false);
        setSearchResults([]);
        fetchNearbyClinics(lat, lng);
    };

    //  Reset to real GPS location 
    const resetToGPS = () => {
        setManualLocation(null);
        setSearchQuery("");
        setSearchResults([]);
        setShowDropdown(false);
        if (userLocation) {
            fetchNearbyClinics(userLocation.lat, userLocation.lng);
        }
    };

    //  Clear search box 
    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setShowDropdown(false);
    };

    //  Close dropdown on outside click

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    //  Get GPS on page load 
    useEffect(() => {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const loc = { lat: coords.latitude, lng: coords.longitude };
                setUserLocation(loc);
                fetchNearbyClinics(coords.latitude, coords.longitude);
            },
            (err) => {
                console.error("GPS error:", err.message);
                // Fallback to Colombo — change to your city if needed
                const fallback = { lat: 6.9271, lng: 79.8612 };
                setUserLocation(fallback);
                fetchNearbyClinics(fallback.lat, fallback.lng);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [fetchNearbyClinics]);

    //  Results label

    const resultsLabel = () => {
        if (loading) return "Searching nearby clinics...";
        if (clinics.length === 0) return "No clinics found nearby";
        const area = manualLocation ? manualLocation.label : "your location";
        const radius = searchedRadius > 5 ? ` (expanded to ${searchedRadius}km)` : "";
        return `${clinics.length} clinic${clinics.length > 1 ? "s" : ""} found near ${area}${radius}`;
    };

    // Add this useEffect to handle the dragging mechanics
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
        
            // Calculate how far the mouse has moved since we clicked
            const deltaX = e.clientX - dragStart.current.x;
            
            // Add that movement to the original starting width
            let newWidth = dragStart.current.width + deltaX;
            
            // Constraints
            if (newWidth < 200) newWidth = 200;
            if (newWidth > 600) newWidth = 600;
            
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            // Prevent accidental text highlighting while dragging
            document.body.style.userSelect = 'none'; 
        } else {
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    return (
        <div className="-m-8 flex flex-col h-screen overflow-hidden bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-1 md:p-2 shadow-sm z-20">
                <div className="container mx-auto">
                    <div className="flex md:flex-row gap-4 items-start md:items-center justify-between mb-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-green-50 border border-green-100 text-green-600 p-2.5 rounded-2xl shadow-sm">
                                <IoNavigateOutline size={24} />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-md md:text-2xl font-bold text-slate-800 mb-1">
                                    Nearest Veterinary Clinics
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {manualLocation
                                        ? `Showing clinics near: ${manualLocation.label}`
                                        : "Finding clinics based on your GPS location"}
                                </p>
                            </div>
                        </div>
                        
                        <Button
                            variant="outline"
                            className="shrink-0 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                            onClick={() =>
                                userLocation && fetchNearbyClinics(userLocation.lat, userLocation.lng)
                            }
                            disabled={loading}
                        >
                            <MapPin size={18} className="mr-2" />
                            {loading ? "Searching..." : "Use My Location"}
                        </Button>
                    </div>

                    {/* Search bar */}
                    <div className="flex gap-2 flex-col sm:flex-row">
                        <div className="relative flex-1" ref={searchRef}>
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none"
                                size={18}
                            />
                            <input
                                type="text"
                                placeholder="Search any city or area to find clinics there..."
                                className="w-full pl-10 pr-10 h-10 bg-slate-50 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                                value={searchQuery}
                                onChange={handleSearchInput}
                                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                autoComplete="off"
                            />

                            {/* Spinner / clear button */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {searchLoading ? (
                                    <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                                ) : searchQuery ? (
                                    <button
                                        onClick={clearSearch}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                ) : null}
                            </div>

                            {/* Dropdown results */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                                    {searchResults.map((place) => (
                                        <button
                                            key={place.place_id}
                                            className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-100 last:border-0 transition-colors"
                                            onMouseDown={(e) => {
                                                // use mousedown so it fires before onBlur
                                                e.preventDefault();
                                                handleSelectPlace(place);
                                            }}
                                        >
                                            <div className="flex items-start gap-2">
                                                <MapPin
                                                    size={16}
                                                    className="text-green-500 mt-0.5 shrink-0"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 leading-tight">
                                                        {place.display_name.split(",")[0]}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {place.display_name
                                                            .split(",")
                                                            .slice(1, 3)
                                                            .join(",")}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Back to GPS button */}
                        {manualLocation && (
                            <Button
                                variant="outline"
                                className="shrink-0 h-11 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                onClick={resetToGPS}
                            >
                                <LocateFixed size={16} className="mr-2" />
                                Back to My Location
                            </Button>
                        )}
                    </div>

                    {/* Manual location banner */}
                    {manualLocation && (
                        <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <MapPin size={14} className="text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium">
                                Showing results near{" "}
                                <span className="font-bold">{manualLocation.label}</span> — not
                                your GPS
                            </p>
                            <button
                                className="ml-auto text-xs text-amber-600 underline hover:text-amber-800 whitespace-nowrap"
                                onClick={resetToGPS}
                            >
                                Reset
                            </button>
                        </div>
                    )}

                    {/* Expanded radius notice */}
                    {!loading && searchedRadius > 5 && clinics.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <span className="text-xs text-blue-700">
                                ℹ️ No clinics found within 5km — expanded search to{" "}
                                <strong>{searchedRadius}km</strong>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View Toggle Tabs */}
            <div className="flex md:hidden border-b border-slate-200 bg-white shrink-0">
                <button
                    onClick={() => setShowMobileMap(false)}
                    className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        !showMobileMap
                            ? "border-green-600 text-green-600 bg-green-50/20"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    List View
                </button>
                <button
                    onClick={() => setShowMobileMap(true)}
                    className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        showMobileMap
                            ? "border-green-600 text-green-600 bg-green-50/20"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    Map View
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden relative">

                {/*  Sidebar */}
                <div 
                    style={{ '--sidebar-width': `${sidebarWidth}px` }}
                    className={`w-full md:w-[var(--sidebar-width)] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-lg transition-transform ${isResizing ? 'duration-0' : 'duration-300'} ${
                        showMobileMap
                            ? "-translate-x-full md:translate-x-0 absolute md:relative"
                            : "translate-x-0"
                    }`}
                >
                    
                    {/* Results count */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-white">
                        <p className="text-sm font-medium text-slate-700">{resultsLabel()}</p>
                    </div>

                    {/* Google Maps fallback */}
                    {!loading && googleFallback && (
                        <div className="mx-4 mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">🗺️</span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-800 mb-1">
                                        No clinics found nearby
                                    </p>
                                    <p className="text-xs text-amber-700 mb-3">
                                        OpenStreetMap has limited data here. Search on Google Maps
                                        to find clinics in your area.
                                    </p>
                                    <a
                                        href={googleFallback}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <MapPin size={14} />
                                        Search on Google Maps
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Clinic list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">

                        {/* Loading */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-3" />
                                <p className="text-sm">Finding nearby clinics...</p>
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && clinics.length === 0 && !googleFallback && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <MapPin size={32} className="mb-3 text-slate-300" />
                                <p className="text-sm text-center">
                                    No clinics found.
                                    <br />
                                    Try searching a different location.
                                </p>
                            </div>
                        )}

                        {/* Cards */}
                        {!loading &&
                            clinics.map((clinic) => (
                                <Card
                                    key={clinic.id}
                                    className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                                        selectedClinic === clinic.id
                                            ? "border-2 border-green-500 ring-2 ring-green-100 shadow-lg bg-white"
                                            : "border border-slate-200 hover:border-green-300 bg-white"
                                    }`}
                                    onClick={() => {
                                        setSelectedClinic(clinic.id);
                                        if (window.innerWidth < 768) {
                                            setShowMobileMap(true);
                                        }
                                    }}
                                >
                                    {/* Card header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 pr-2">
                                            <h3 className="font-bold text-base text-slate-800 leading-tight mb-1">
                                                {clinic.name}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {clinic.type}
                                                </span>
                                                {clinic.distance && (
                                                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                                        {clinic.distance} km
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={clinic.open ? "success" : "danger"}
                                            className="text-[11px] shrink-0 font-semibold"
                                        >
                                            {clinic.open ? "Open" : "Closed"}
                                        </Badge>
                                    </div>

                                    {/* Address & hours */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-start gap-2 text-sm text-slate-600">
                                            <MapPin
                                                size={16}
                                                className="mt-0.5 shrink-0 text-slate-400"
                                            />
                                            <span className="leading-tight">{clinic.address}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Clock size={16} className="shrink-0 text-slate-400" />
                                            <span>{clinic.hours}</span>
                                        </div>
                                    </div>

                                    {/* Distance badge */}
                                    <div className="mb-4">
                                        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                            <Navigation2
                                                size={14}
                                                className="text-blue-600"
                                            />
                                            {clinic.distance} km away
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 h-9 font-medium shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                    `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`,
                                                    "_blank"
                                                );
                                            }}
                                        >
                                            <Navigation2 size={16} className="mr-1.5" />
                                            Directions
                                        </Button>
                                        {clinic.phone && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-9 font-medium border-slate-300 hover:bg-slate-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `tel:${clinic.phone}`;
                                                }}
                                            >
                                                <PhoneCall size={16} className="mr-1.5" />
                                                Call Now
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                    </div>

                    {/* DRAG HANDLE (Hidden on mobile, visible on desktop) */}
                    <div
                        onMouseDown={(e) => {
                            setIsResizing(true);
                            // Save the exact mouse X and the current width the moment they click
                            dragStart.current = { x: e.clientX, width: sidebarWidth }; 
                        }}
                        className={`hidden md:block absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-50 transition-colors
                            ${isResizing ? "bg-slate-500/50" : "bg-transparent hover:bg-slate-300/50"}
                        `}
                    />
                </div>

                {/*  Map */}
                <ClinicMap
                    clinics={clinics}
                    selectedClinic={selectedClinic}
                    userLocation={userLocation}
                    manualLocation={manualLocation}
                />
            </div>
        </div>
    );
}