import https from "https";

// 1. Google Places Proxy
export const getNearbyClinics = (req, res) => {
    const { lat, lng } = req.query;
    // Note: Move this key to your .env file later for security!
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 

    if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng are required" });
    }

    const body = JSON.stringify({
        includedTypes: ["veterinary_care"],
        maxResultCount: 20,
        locationRestriction: {
            circle: {
                center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
                radius: 10000.0
            }
        }
    });

    const options = {
        hostname: "places.googleapis.com",
        path: "/v1/places:searchNearby",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.nationalPhoneNumber"
        }
    };

    const request = https.request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => { data += chunk; });
        response.on("end", () => {
            try {
                const parsed = JSON.parse(data);
                res.json(parsed);
            } catch (err) {
                res.status(500).json({ error: "Failed to parse Google response" });
            }
        });
    });

    request.on("error", (err) => res.status(500).json({ error: err.message }));
    request.write(body);
    request.end();
};

// 2. Nominatim Search Proxy
export const searchPlaces = (req, res) => {
    const { q } = req.query;

    if (!q) return res.status(400).json({ error: "q is required" });

    const encodedQ = encodeURIComponent(q);
    const options = {
        hostname: "nominatim.openstreetmap.org",
        path: `/search?q=${encodedQ}&format=json&limit=5&addressdetails=1`,
        method: "GET",
        headers: {
            "Accept-Language": "en",
            "User-Agent": "VetClinicFinder/1.0"
        }
    };

    const request = https.request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => { data += chunk; });
        response.on("end", () => {
            try {
                res.json(JSON.parse(data));
            } catch (err) {
                res.status(500).json({ error: "Failed to parse response" });
            }
        });
    });

    request.on("error", (err) => res.status(500).json({ error: err.message }));
    request.end();
};