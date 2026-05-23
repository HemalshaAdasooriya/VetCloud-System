import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { io } from "socket.io-client";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ClinicMap({ clinics = [], selectedClinic }) {
  const mapRef  = useRef(null);
  const mapObj  = useRef(null);
  const markers = useRef({});
  const [online, setOnline] = useState(false);

  // ── Icons defined here so both useEffects can use them ────────
  const clinicIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize:    [25, 41],
    iconAnchor:  [12, 41],
    popupAnchor: [1, -34],
    shadowSize:  [41, 41],
  });

  const youIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize:    [25, 41],
    iconAnchor:  [12, 41],
    popupAnchor: [1, -34],
    shadowSize:  [41, 41],
  });

  // ── 1. Build the map ──────────────────────────────────────────
  useEffect(() => {
    if (mapObj.current) return;
    mapObj.current = L.map(mapRef.current).setView([0, 0], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapObj.current);
    return () => { mapObj.current?.remove(); mapObj.current = null; };
  }, []);

  // ── 2. Clinic markers (RED icon) ──────────────────────────────
  useEffect(() => {
    if (!mapObj.current) return;
    Object.keys(markers.current)
      .filter((k) => k.startsWith("clinic-"))
      .forEach((k) => { markers.current[k].remove(); delete markers.current[k]; });

    clinics.forEach((clinic) => {
      if (!clinic.lat || !clinic.lng) return;

      // ✅ RED icon used here
      const m = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon })
        .addTo(mapObj.current)
        .bindPopup(`<b>${clinic.name}</b><br/>${clinic.address}<br/>
          <span style="color:${clinic.open ? 'green' : 'red'}">
            ${clinic.open ? "● Open" : "● Closed"}
          </span>`);
      markers.current[`clinic-${clinic.id}`] = m;

      if (clinic.id === selectedClinic) {
        mapObj.current.setView([clinic.lat, clinic.lng], 15);
        m.openPopup();
      }
    });
  }, [clinics, selectedClinic]);

  // ── 3. Socket + Geolocation (BLUE icon for you) ───────────────
  useEffect(() => {
    const socket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setOnline(true));
    socket.on("disconnect", () => setOnline(false));
    socket.on("connect_error", () => setOnline(false));

    socket.on("receive-location", ({ id, latitude, longitude }) => {
      if (!mapObj.current) return;
      if (markers.current[id]) {
        markers.current[id].setLatLng([latitude, longitude]);
      } else {
        markers.current[id] = L.marker([latitude, longitude]).addTo(mapObj.current);
      }
    });

    socket.on("user-disconnected", (id) => {
      markers.current[id]?.remove();
      delete markers.current[id];
    });

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          socket.emit("send-location", { latitude, longitude });

          if (markers.current["__you__"]) {
            markers.current["__you__"].setLatLng([latitude, longitude]);
          } else {
            // ✅ BLUE icon used here
            markers.current["__you__"] = L.marker([latitude, longitude], { icon: youIcon })
              .addTo(mapObj.current)
              .bindPopup("<b>📍 You are here</b>");
            mapObj.current.setView([latitude, longitude], 15);
          }
        },
        (err) => console.error("Geolocation error:", err.message),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    return () => socket.disconnect();
  }, []);

  return (
    <div className="relative flex-1 h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className={`absolute top-3 right-3 z-[1000] flex items-center gap-2
        px-3 py-1 rounded-full text-xs font-semibold shadow
        ${online ? "bg-green-100 text-green-700 border border-green-300"
                 : "bg-red-100 text-red-600 border border-red-300"}`}>
        <span className={`w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-red-400"}`} />
        {online ? "Live" : "Offline"}
      </div>
    </div>
  );
}