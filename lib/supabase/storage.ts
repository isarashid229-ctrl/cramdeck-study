import { createClient } from "@/lib/supabase/client";

const BUCKET = "assignments";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const STORAGE_SETUP_MESSAGE = "Storage policy needs setup. Assignment was saved, but file upload was skipped.";

/** Upload assignment file to Supabase Storage. Requires an `assignments` bucket with RLS policies. */
export async function uploadAssignmentFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be under 10MB");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to upload files");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/assignments/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("bucket not found")) {
      throw new Error("Storage bucket not configured. Assignment was saved, but file upload was skipped.");
    }
    if (message.includes("row-level security") || message.includes("violates row-level security")) {
      throw new Error(STORAGE_SETUP_MESSAGE);
    }
    throw new Error("File upload failed. Assignment was saved, but file upload was skipped.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
