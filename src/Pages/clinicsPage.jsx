
import { Badge, Button, Card, Input } from "../components/Ui/ui";
import ClinicMap from "./ClinicMap";
import Navigation from "../layouts/navigation";
import { Clock, Filter, MapPin, Navigation2, PhoneCall, Search, Star, LocateFixed } from "lucide-react";
import { useState, useEffect, useRef } from "react";


// export default function ClinicsPage() {
//     const [isFullscreen, setIsFullscreen] = useState(false);
//     const [showMobileMap, setShowMobileMap] = useState(false);
//     const [selectedClinic, setSelectedClinic] = useState(1);

//     const [clinics, setClinics] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [userLocation, setUserLocation] = useState(null);

//     const fetchNearbyClinics = async (lat, lng) => {
//   setLoading(true);
//   try {
//     // Overpass API — finds vets within 5km of your location
//     const query = `
//       [out:json][timeout:25];
//       (
//         node["amenity"="veterinary"](around:5000,${lat},${lng});
//         way["amenity"="veterinary"](around:5000,${lat},${lng});
//         node["amenity"="animal_hospital"](around:5000,${lat},${lng});
//         node["healthcare"="veterinary"](around:5000,${lat},${lng});
//       );
//       out body;
//       >;
//       out skel qt;
//     `;

//     const res = await fetch("https://overpass-api.de/api/interpreter", {
//       method: "POST",
//       body: query,
//     });

//     const data = await res.json();

//     const found = data.elements
//       .filter((el) => el.lat && el.lon)
//       .map((el, i) => {
//         const tags = el.tags || {};
//         // Calculate distance in km
//         const R = 6371;
//         const dLat = ((el.lat - lat) * Math.PI) / 180;
//         const dLon = ((el.lon - lng) * Math.PI) / 180;
//         const a =
//           Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//           Math.cos((lat * Math.PI) / 180) *
//             Math.cos((el.lat * Math.PI) / 180) *
//             Math.sin(dLon / 2) *
//             Math.sin(dLon / 2);
//         const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//         return {
//           id: el.id || i,
//           name: tags.name || "Unnamed Veterinary Clinic",
//           address: [tags["addr:street"], tags["addr:city"]]
//             .filter(Boolean)
//             .join(", ") || "Address not available",
//           phone: tags.phone || tags["contact:phone"] || null,
//           hours: tags.opening_hours || "Hours not listed",
//           type: tags.healthcare === "veterinary" ? "Veterinary" : "Animal Hospital",
//           open: true, // Overpass doesn't give live open/close status
//           rating: null,
//           reviews: null,
//           lat: el.lat,
//           lng: el.lon,
//           distance: dist.toFixed(1),
//         };
//       })
//       .sort((a, b) => a.distance - b.distance); // nearest first

//     setClinics(found);
//   } catch (err) {
//     console.error("Failed to fetch clinics:", err);
//   } finally {
//     setLoading(false);
//   }
// };

// useEffect(() => {
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(
//       ({ coords }) => {
//         setUserLocation({ lat: coords.latitude, lng: coords.longitude });
//         fetchNearbyClinics(coords.latitude, coords.longitude);
//       },
//       (err) => console.error("Location error:", err.message),
//       { enableHighAccuracy: true }
//     );
//   }
// }, []);
//     return (
//         <div className="flex flex-col h-[calc(100vh-1rem)] bg-slate-50">
//             <Navigation />
//             {/* Header */}
//             <div className="bg-white border-b border-slate-200 p-4 md:p-6 shadow-sm z-20">
//                 <div className="container mx-auto">
//                     <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
//                         <div>
//                             <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">Nearest Veterinary Clinics</h1>
//                             <p className="text-sm text-slate-500">Find emergency care and local vet clinics based on your GPS location</p>
//                         </div>
//                         <Button 
//                             variant="outline" 
//                             className="shrink-0 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
//                             >
//                             <MapPin size={18} className="mr-2" /> Use My Location
//                         </Button>
//                     </div>

//                     {/* Search and Filters */}
//                     <div className="flex gap-2 flex-col sm:flex-row">
//                         <div className="relative flex-1">
//                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                         <Input 
//                             placeholder="Search location or clinic name..." 
//                             className="pl-10 h-11 bg-slate-50 border-slate-300" 
//                         />
//                         </div>
//                         <Button variant="outline" className="shrink-0 bg-white h-11">
//                         <Filter size={18} className="mr-2" /> Filters
//                         </Button>
//                     </div>
//                 </div>
//             </div>

//             <div className="flex-1 flex overflow-hidden relative">
//                 {/* Sidebar List */}
//                 <div className={`w-full md:w-[320px] bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-lg transition-transform duration-300 ${showMobileMap ? '-translate-x-full md:translate-x-0 absolute md:relative' : 'translate-x-0'}`}>
//                     {/* Filter Tags */}
//                     <div className="p-4 border-b border-slate-100 bg-slate-50">
//                         <div className="flex items-center gap-2 mb-2">
//                             <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Quick Filters</span>
//                         </div>

//                         <div className="flex gap-2 flex-wrap">
//                             <Badge variant="success" className="cursor-pointer whitespace-nowrap shadow-sm hover:shadow transition-shadow">
//                                 ✓ Open Now
//                             </Badge>
//                             <Badge variant="default" className="cursor-pointer whitespace-nowrap bg-white border-2 border-slate-300 text-slate-700 hover:border-green-500 hover:bg-green-50 transition-all">
//                                 24/7 Emergency
//                             </Badge>
//                             <Badge variant="default" className="cursor-pointer whitespace-nowrap bg-white border-2 border-slate-300 text-slate-700 hover:border-green-500 hover:bg-green-50 transition-all">
//                                 Large Animals
//                             </Badge>
//                         </div>
//                     </div>

//                     {/* Results Header */}
//                     <div className="px-4 py-3 border-b border-slate-100 bg-white">
//                         <p className="text-sm font-medium text-slate-700">{clinics.length} clinics found near you</p>
//                     </div>

//                     {/* Clinic List */}
//                     <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
//                         {clinics.map((clinic) => (
//                         <Card 
//                             key={clinic.id} 
//                             className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
//                             selectedClinic === clinic.id 
//                                 ? 'border-2 border-green-500 ring-2 ring-green-100 shadow-lg bg-white' 
//                                 : 'border border-slate-200 hover:border-green-300 bg-white'
//                             }`}
//                             onClick={() => setSelectedClinic(clinic.id)}
//                         >
//                             {/* Header */}
//                             <div className="flex justify-between items-start mb-3">
//                                 <div className="flex-1">
//                                     <h3 className="font-bold text-base text-slate-800 leading-tight mb-1">{clinic.name}</h3>
//                                     <div className="flex items-center gap-2">
//                                     <div className="flex items-center gap-1">
//                                         <Star size={14} className="text-amber-400 fill-amber-400" />
//                                         <span className="text-sm font-semibold text-slate-700">{clinic.rating}</span>
//                                         <span className="text-xs text-slate-500">({clinic.reviews})</span>
//                                     </div>
//                                     <span className="text-slate-300">•</span>
//                                     <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{clinic.type}</span>
//                                     </div>
//                                 </div>
//                                 <Badge 
//                                     variant={clinic.open ? 'success' : 'danger'} 
//                                     className="text-[11px] shrink-0 ml-2 font-semibold"
//                                 >
//                                     {clinic.open ? 'Open' : 'Closed'}
//                                 </Badge>
//                             </div>
                            
//                             {/* Info Section */}
//                             <div className="space-y-2 mb-4">
//                             <div className="flex items-start gap-2 text-sm text-slate-600">
//                                 <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
//                                 <span className="leading-tight">{clinic.address}</span>
//                             </div>
                            
//                             <div className="flex items-center gap-2 text-sm text-slate-600">
//                                 <Clock size={16} className="shrink-0 text-slate-400" />
//                                 <span>{clinic.hours}</span>
//                             </div>
//                             </div>
                            
//                             {/* Distance Badge */}
//                             <div className="mb-4">
//                             <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
//                                 <Navigation2 size={14} className="text-blue-600" />
//                                 {clinic.distance} away
//                             </div>
//                             </div>
                            
//                             {/* Action Buttons */}
//                             <div className="flex gap-2">
//                             <Button size="sm" className="flex-1 h-9 font-medium shadow-sm">
//                                 <Navigation2 size={16} className="mr-1.5" /> Get Directions
//                             </Button>
//                             <Button variant="outline" size="sm" className="flex-1 h-9 font-medium border-slate-300 hover:bg-slate-50">
//                                 <PhoneCall size={16} className="mr-1.5" /> Call Now
//                             </Button>
//                             </div>
//                         </Card>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Map View */}
//                 <ClinicMap clinics={clinics} selectedClinic={selectedClinic} />
                
          
//             </div>
//         </div>
//     )
// }

// export default function ClinicsPage() {
//     const [isFullscreen, setIsFullscreen] = useState(false);
//     const [showMobileMap, setShowMobileMap] = useState(false);
//     const [selectedClinic, setSelectedClinic] = useState(null);

//     // ── STEP 1: Replace hardcoded clinics array with state ──────
//     const [clinics, setClinics] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [userLocation, setUserLocation] = useState(null);

//     // ── STEP 2: Fetch nearby clinics from OpenStreetMap ─────────
//     const fetchNearbyClinics = async (lat, lng) => {
//         setLoading(true);
//         try {
//             const query = `
//                 [out:json][timeout:25];
//                 (
//                     node["amenity"="veterinary"](around:5000,${lat},${lng});
//                     way["amenity"="veterinary"](around:5000,${lat},${lng});
//                     node["amenity"="animal_hospital"](around:5000,${lat},${lng});
//                     node["healthcare"="veterinary"](around:5000,${lat},${lng});
//                 );
//                 out body;
//                 >;
//                 out skel qt;
//             `;

//             const res = await fetch("https://overpass-api.de/api/interpreter", {
//                 method: "POST",
//                 body: query,
//             });

//             const data = await res.json();

//             const found = data.elements
//                 .filter((el) => el.lat && el.lon)
//                 .map((el, i) => {
//                     const tags = el.tags || {};

//                     // Calculate distance in km
//                     const R = 6371;
//                     const dLat = ((el.lat - lat) * Math.PI) / 180;
//                     const dLon = ((el.lon - lng) * Math.PI) / 180;
//                     const a =
//                         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//                         Math.cos((lat * Math.PI) / 180) *
//                         Math.cos((el.lat * Math.PI) / 180) *
//                         Math.sin(dLon / 2) *
//                         Math.sin(dLon / 2);
//                     const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//                     return {
//                         id: el.id || i,
//                         name: tags.name || "Unnamed Veterinary Clinic",
//                         address: [tags["addr:street"], tags["addr:city"]]
//                             .filter(Boolean)
//                             .join(", ") || "Address not available",
//                         phone: tags.phone || tags["contact:phone"] || null,
//                         hours: tags.opening_hours || "Hours not listed",
//                         type: tags.healthcare === "veterinary" ? "Veterinary" : "Animal Hospital",
//                         open: true,
//                         rating: null,
//                         reviews: null,
//                         lat: el.lat,
//                         lng: el.lon,
//                         distance: dist.toFixed(1),
//                     };
//                 })
//                 .sort((a, b) => a.distance - b.distance);

//             setClinics(found);
//         } catch (err) {
//             console.error("Failed to fetch clinics:", err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ── STEP 3: Auto-fetch on page load using GPS ───────────────
//     useEffect(() => {
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 ({ coords }) => {
//                     const loc = { lat: coords.latitude, lng: coords.longitude };
//                     setUserLocation(loc);
//                     fetchNearbyClinics(coords.latitude, coords.longitude);
//                 },
//                 (err) => console.error("Location error:", err.message),
//                 { enableHighAccuracy: true }
//             );
//         }
//     }, []);

//     return (
//         <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
//             <Navigation />

//             {/* Header */}
//             <div className="bg-white border-b border-slate-200 p-4 md:p-6 shadow-sm z-20">
//                 <div className="container mx-auto">
//                     <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
//                         <div>
//                             <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">
//                                 Nearest Veterinary Clinics
//                             </h1>
//                             <p className="text-sm text-slate-500">
//                                 Find emergency care and local vet clinics based on your GPS location
//                             </p>
//                         </div>

//                         {/* STEP 4: Button with onClick + loading text */}
//                         <Button
//                             variant="outline"
//                             className="shrink-0 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
//                             onClick={() =>
//                                 userLocation &&
//                                 fetchNearbyClinics(userLocation.lat, userLocation.lng)
//                             }
//                         >
//                             <MapPin size={18} className="mr-2" />
//                             {loading ? "Searching..." : "Use My Location"}
//                         </Button>
//                     </div>

//                     {/* Search and Filters */}
//                     <div className="flex gap-2 flex-col sm:flex-row">
//                         <div className="relative flex-1">
//                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                             <Input
//                                 placeholder="Search location or clinic name..."
//                                 className="pl-10 h-11 bg-slate-50 border-slate-300"
//                             />
//                         </div>
//                         <Button variant="outline" className="shrink-0 bg-white h-11">
//                             <Filter size={18} className="mr-2" /> Filters
//                         </Button>
//                     </div>
//                 </div>
//             </div>

//             <div className="flex-1 flex overflow-hidden relative">

//                 {/* Sidebar List */}
//                 <div className={`w-full md:w-[320px] bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-lg transition-transform duration-300 ${showMobileMap ? '-translate-x-full md:translate-x-0 absolute md:relative' : 'translate-x-0'}`}>

//                     {/* Filter Tags */}
//                     <div className="p-4 border-b border-slate-100 bg-slate-50">
//                         <div className="flex items-center gap-2 mb-2">
//                             <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
//                                 Quick Filters
//                             </span>
//                         </div>
//                         <div className="flex gap-2 flex-wrap">
//                             <Badge variant="success" className="cursor-pointer whitespace-nowrap shadow-sm hover:shadow transition-shadow">
//                                 ✓ Open Now
//                             </Badge>
//                             <Badge variant="default" className="cursor-pointer whitespace-nowrap bg-white border-2 border-slate-300 text-slate-700 hover:border-green-500 hover:bg-green-50 transition-all">
//                                 24/7 Emergency
//                             </Badge>
//                             <Badge variant="default" className="cursor-pointer whitespace-nowrap bg-white border-2 border-slate-300 text-slate-700 hover:border-green-500 hover:bg-green-50 transition-all">
//                                 Large Animals
//                             </Badge>
//                         </div>
//                     </div>

//                     {/* STEP 5: Results count with loading state */}
//                     <div className="px-4 py-3 border-b border-slate-100 bg-white">
//                         <p className="text-sm font-medium text-slate-700">
//                             {loading
//                                 ? "Searching nearby clinics..."
//                                 : clinics.length > 0
//                                 ? `${clinics.length} clinics found near you`
//                                 : "No clinics found nearby"}
//                         </p>
//                     </div>

//                     {/* Clinic List */}
//                     <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">

//                         {/* Loading spinner */}
//                         {loading && (
//                             <div className="flex flex-col items-center justify-center py-12 text-slate-400">
//                                 <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-3" />
//                                 <p className="text-sm">Finding nearby clinics...</p>
//                             </div>
//                         )}

//                         {/* Empty state */}
//                         {!loading && clinics.length === 0 && (
//                             <div className="flex flex-col items-center justify-center py-12 text-slate-400">
//                                 <MapPin size={32} className="mb-3 text-slate-300" />
//                                 <p className="text-sm text-center">
//                                     No clinics found nearby. <br />
//                                     Try clicking "Use My Location"
//                                 </p>
//                             </div>
//                         )}

//                         {/* STEP 6: Clinic cards with null-safe rating/phone */}
//                         {!loading && clinics.map((clinic) => (
//                             <Card
//                                 key={clinic.id}
//                                 className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
//                                     selectedClinic === clinic.id
//                                         ? 'border-2 border-green-500 ring-2 ring-green-100 shadow-lg bg-white'
//                                         : 'border border-slate-200 hover:border-green-300 bg-white'
//                                 }`}
//                                 onClick={() => setSelectedClinic(clinic.id)}
//                             >
//                                 {/* Header */}
//                                 <div className="flex justify-between items-start mb-3">
//                                     <div className="flex-1">
//                                         <h3 className="font-bold text-base text-slate-800 leading-tight mb-1">
//                                             {clinic.name}
//                                         </h3>
//                                         <div className="flex items-center gap-2 flex-wrap">
//                                             {/* Only show rating if available */}
//                                             {clinic.rating && (
//                                                 <div className="flex items-center gap-1">
//                                                     <Star size={14} className="text-amber-400 fill-amber-400" />
//                                                     <span className="text-sm font-semibold text-slate-700">
//                                                         {clinic.rating}
//                                                     </span>
//                                                     {clinic.reviews && (
//                                                         <span className="text-xs text-slate-500">
//                                                             ({clinic.reviews})
//                                                         </span>
//                                                     )}
//                                                 </div>
//                                             )}
//                                             <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
//                                                 {clinic.type}
//                                             </span>
//                                         </div>
//                                     </div>
//                                     <Badge
//                                         variant={clinic.open ? 'success' : 'danger'}
//                                         className="text-[11px] shrink-0 ml-2 font-semibold"
//                                     >
//                                         {clinic.open ? 'Open' : 'Closed'}
//                                     </Badge>
//                                 </div>

//                                 {/* Info */}
//                                 <div className="space-y-2 mb-4">
//                                     <div className="flex items-start gap-2 text-sm text-slate-600">
//                                         <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
//                                         <span className="leading-tight">{clinic.address}</span>
//                                     </div>
//                                     <div className="flex items-center gap-2 text-sm text-slate-600">
//                                         <Clock size={16} className="shrink-0 text-slate-400" />
//                                         <span>{clinic.hours}</span>
//                                     </div>
//                                 </div>

//                                 {/* Distance */}
//                                 <div className="mb-4">
//                                     <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
//                                         <Navigation2 size={14} className="text-blue-600" />
//                                         {clinic.distance} km away
//                                     </div>
//                                 </div>

//                                 {/* Action Buttons */}
//                                 <div className="flex gap-2">
//                                     <Button size="sm" className="flex-1 h-9 font-medium shadow-sm">
//                                         <Navigation2 size={16} className="mr-1.5" /> Get Directions
//                                     </Button>
//                                     {/* Only show Call button if phone number exists */}
//                                     {clinic.phone && (
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             className="flex-1 h-9 font-medium border-slate-300 hover:bg-slate-50"
//                                             onClick={(e) => {
//                                                 e.stopPropagation();
//                                                 window.location.href = `tel:${clinic.phone}`;
//                                             }}
//                                         >
//                                             <PhoneCall size={16} className="mr-1.5" /> Call Now
//                                         </Button>
//                                     )}
//                                 </div>
//                             </Card>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Map */}
//                 <ClinicMap clinics={clinics} selectedClinic={selectedClinic} />

//             </div>
//         </div>
//     );
// }

export default function ClinicsPage() {
    const [showMobileMap, setShowMobileMap] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    // ── Manual location search state ─────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [manualLocation, setManualLocation] = useState(null); // {lat, lng, label}
    const searchRef = useRef(null);

    // ── Fetch nearby clinics from OpenStreetMap ───────────────────
    const fetchNearbyClinics = async (lat, lng) => {
        setLoading(true);
        try {
            const query = `
                [out:json][timeout:25];
                (
                    node["amenity"="veterinary"](around:5000,${lat},${lng});
                    way["amenity"="veterinary"](around:5000,${lat},${lng});
                    node["amenity"="animal_hospital"](around:5000,${lat},${lng});
                    node["healthcare"="veterinary"](around:5000,${lat},${lng});
                );
                out body;
                >;
                out skel qt;
            `;
            const res = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: query,
            });
            const data = await res.json();
            const found = data.elements
                .filter((el) => el.lat && el.lon)
                .map((el, i) => {
                    const tags = el.tags || {};
                    const R = 6371;
                    const dLat = ((el.lat - lat) * Math.PI) / 180;
                    const dLon = ((el.lon - lng) * Math.PI) / 180;
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos((lat * Math.PI) / 180) *
                        Math.cos((el.lat * Math.PI) / 180) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);
                    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return {
                        id: el.id || i,
                        name: tags.name || "Unnamed Veterinary Clinic",
                        address: [tags["addr:street"], tags["addr:city"]]
                            .filter(Boolean).join(", ") || "Address not available",
                        phone: tags.phone || tags["contact:phone"] || null,
                        hours: tags.opening_hours || "Hours not listed",
                        type: tags.healthcare === "veterinary" ? "Veterinary" : "Animal Hospital",
                        open: true,
                        rating: null,
                        reviews: null,
                        lat: el.lat,
                        lng: el.lon,
                        distance: dist.toFixed(1),
                    };
                })
                .sort((a, b) => a.distance - b.distance);
            setClinics(found);
        } catch (err) {
            console.error("Failed to fetch clinics:", err);
        } finally {
            setLoading(false);
        }
    };

    // ── Search places using Nominatim (free, no API key) ─────────
    const searchPlaces = async (query) => {
        if (!query || query.trim().length < 3) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setSearchLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            setSearchResults(data);
            setShowDropdown(data.length > 0);
        } catch (err) {
            console.error("Place search failed:", err);
        } finally {
            setSearchLoading(false);
        }
    };

    // ── Debounce the search input ─────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => {
            searchPlaces(searchQuery);
        }, 400); // wait 400ms after user stops typing
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ── When user picks a place from dropdown ─────────────────────
    const handleSelectPlace = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        const label = place.display_name.split(",").slice(0, 2).join(",");
        setManualLocation({ lat, lng, label });
        setSearchQuery(label);
        setShowDropdown(false);
        fetchNearbyClinics(lat, lng);
    };

    // ── Reset back to GPS location ────────────────────────────────
    const resetToGPS = () => {
        setManualLocation(null);
        setSearchQuery("");
        if (userLocation) {
            fetchNearbyClinics(userLocation.lat, userLocation.lng);
        }
    };

    // ── Close dropdown when clicking outside ─────────────────────
    useEffect(() => {
        const handleClick = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // ── Auto-fetch on page load using GPS ─────────────────────────
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const loc = { lat: coords.latitude, lng: coords.longitude };
                    setUserLocation(loc);
                    fetchNearbyClinics(coords.latitude, coords.longitude);
                },
                (err) => console.error("Location error:", err.message),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
            <Navigation />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 md:p-6 shadow-sm z-20">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">
                                Nearest Veterinary Clinics
                            </h1>
                            <p className="text-sm text-slate-500">
                                {manualLocation
                                    ? `Showing clinics near: ${manualLocation.label}`
                                    : "Find clinics based on your GPS location"}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="shrink-0 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                            onClick={() => userLocation && fetchNearbyClinics(userLocation.lat, userLocation.lng)}
                        >
                            <MapPin size={18} className="mr-2" />
                            {loading ? "Searching..." : "Use My Location"}
                        </Button>
                    </div>

                    {/* ── Manual location search box ── */}
                    <div className="flex gap-2 flex-col sm:flex-row">
                        <div className="relative flex-1" ref={searchRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                            <Input
                                placeholder="Search any city or area to find clinics there..."
                                className="pl-10 h-11 bg-slate-50 border-slate-300 pr-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                            />

                            {/* Clear / loading indicator inside input */}
                            {searchLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                                </div>
                            )}
                            {!searchLoading && searchQuery && (
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    onClick={() => { setSearchQuery(""); setSearchResults([]); setShowDropdown(false); }}
                                >
                                    ✕
                                </button>
                            )}

                            {/* Dropdown results */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {searchResults.map((place) => (
                                        <button
                                            key={place.place_id}
                                            className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-100 last:border-0 transition-colors"
                                            onClick={() => handleSelectPlace(place)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <MapPin size={14} className="text-green-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 leading-tight">
                                                        {place.display_name.split(",")[0]}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {place.display_name.split(",").slice(1, 3).join(",")}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reset to GPS button — only shows when manual location is active */}
                        {manualLocation && (
                            <Button
                                variant="outline"
                                className="shrink-0 h-11 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                onClick={resetToGPS}
                            >
                                <LocateFixed size={18} className="mr-2" /> Back to My Location
                            </Button>
                        )}

                        <Button variant="outline" className="shrink-0 bg-white h-11">
                            <Filter size={18} className="mr-2" /> Filters
                        </Button>
                    </div>

                    {/* Active location banner */}
                    {manualLocation && (
                        <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <MapPin size={14} className="text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-700 font-medium">
                                Showing results near <span className="font-bold">{manualLocation.label}</span> — not your current GPS location
                            </p>
                            <button
                                className="ml-auto text-xs text-amber-600 underline hover:text-amber-800"
                                onClick={resetToGPS}
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">

                {/* Sidebar */}
                <div className={`w-full md:w-[320px] bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-lg transition-transform duration-300 ${showMobileMap ? '-translate-x-full md:translate-x-0 absolute md:relative' : 'translate-x-0'}`}>

                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Quick Filters
                            </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Badge variant="success" className="cursor-pointer whitespace-nowrap shadow-sm">
                                ✓ Open Now
                            </Badge>
                            <Badge variant="default" className="cursor-pointer whitespace-nowrap bg-white border-2 border-slate-300 text-slate-700 hover:border-green-500 hover:bg-green-50 transition-all">
                                24/7 Emergency
                            </Badge>
                            <Badge variant="default" className="cursor-pointer whitespace-nowrap bg-white border-2 border-slate-300 text-slate-700 hover:border-green-500 hover:bg-green-50 transition-all">
                                Large Animals
                            </Badge>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-b border-slate-100 bg-white">
                        <p className="text-sm font-medium text-slate-700">
                            {loading
                                ? "Searching nearby clinics..."
                                : clinics.length > 0
                                ? `${clinics.length} clinics found near you`
                                : "No clinics found nearby"}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-3" />
                                <p className="text-sm">Finding nearby clinics...</p>
                            </div>
                        )}

                        {!loading && clinics.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <MapPin size={32} className="mb-3 text-slate-300" />
                                <p className="text-sm text-center">
                                    No clinics found nearby.<br />
                                    Try searching a different location.
                                </p>
                            </div>
                        )}

                        {!loading && clinics.map((clinic) => (
                            <Card
                                key={clinic.id}
                                className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
                                    selectedClinic === clinic.id
                                        ? 'border-2 border-green-500 ring-2 ring-green-100 shadow-lg bg-white'
                                        : 'border border-slate-200 hover:border-green-300 bg-white'
                                }`}
                                onClick={() => setSelectedClinic(clinic.id)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base text-slate-800 leading-tight mb-1">
                                            {clinic.name}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {clinic.rating && (
                                                <div className="flex items-center gap-1">
                                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                                    <span className="text-sm font-semibold text-slate-700">{clinic.rating}</span>
                                                </div>
                                            )}
                                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {clinic.type}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant={clinic.open ? 'success' : 'danger'} className="text-[11px] shrink-0 ml-2 font-semibold">
                                        {clinic.open ? 'Open' : 'Closed'}
                                    </Badge>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-start gap-2 text-sm text-slate-600">
                                        <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                                        <span className="leading-tight">{clinic.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Clock size={16} className="shrink-0 text-slate-400" />
                                        <span>{clinic.hours}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                        <Navigation2 size={14} className="text-blue-600" />
                                        {clinic.distance} km away
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" className="flex-1 h-9 font-medium shadow-sm">
                                        <Navigation2 size={16} className="mr-1.5" /> Get Directions
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
                                            <PhoneCall size={16} className="mr-1.5" /> Call Now
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Map — pass manualLocation so map can show a pin there too */}
                <ClinicMap
                    clinics={clinics}
                    selectedClinic={selectedClinic}
                    manualLocation={manualLocation}
                />
            </div>
        </div>
    );
}