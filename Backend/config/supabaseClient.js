import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import path from "path";

const DEFAULT_SUPABASE_URL = "https://fmuznyrfnjdwxbqsdijw.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdXpueXJmbmpkd3hicXNkaWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTE5NzYsImV4cCI6MjEwMTMyNzk3Nn0.s54DaFgCXjExps99hSHlDoF6R8klW_ItA5yBy4E_V6U";

const rawUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a Multer memoryStorage file buffer to Supabase Storage bucket 'uploads'
 * @param {Object} file - Multer file object containing buffer, originalname, mimetype
 * @param {string} prefix - Optional filename prefix
 * @returns {Promise<string|null>} Public URL of uploaded file
 */
export async function uploadToSupabase(file, prefix = "file") {
    if (!file || !file.buffer) return null;

    try {
        const ext = file.originalname ? path.extname(file.originalname) : "";
        const cleanExt = ext || (file.mimetype ? `.${file.mimetype.split('/')[1]}` : "");
        const fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}${cleanExt}`;

        const { data, error } = await supabase.storage
            .from("uploads")
            .upload(fileName, file.buffer, {
                contentType: file.mimetype || "application/octet-stream",
                upsert: true
            });

        if (error) {
            if (error.message && error.message.includes("row-level security policy")) {
                console.error("Supabase Storage Error: Row-Level Security (RLS) is blocking uploads. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables or enable insert RLS policy on bucket 'uploads' in Supabase Dashboard.");
            } else {
                console.error("Supabase Storage upload error:", error);
            }
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (err) {
        console.error("Failed to upload file to Supabase Storage:", err);
        throw err;
    }
}
