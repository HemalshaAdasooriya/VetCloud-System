import dotenv from "dotenv";
dotenv.config();

import { uploadToSupabase, supabase } from "../config/supabaseClient.js";

async function testUpload() {
    console.log("Testing Supabase Storage upload...");
    console.log("Supabase URL:", process.env.SUPABASE_URL);

    const dummyFile = {
        buffer: Buffer.from("Test content for VetCloud file upload"),
        originalname: "test.txt",
        mimetype: "text/plain"
    };

    try {
        const publicUrl = await uploadToSupabase(dummyFile, "test");
        console.log("Upload SUCCESS! Public URL:", publicUrl);

        // Fetch URL to check if it's publicly accessible
        const res = await fetch(publicUrl);
        console.log("Public URL fetch status:", res.status);
        const text = await res.text();
        console.log("Public URL response body:", text);
    } catch (err) {
        console.error("Test upload FAILED with error:", err);
    }
}

testUpload();
