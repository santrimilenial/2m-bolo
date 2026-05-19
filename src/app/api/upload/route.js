import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Whitelist of allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json({ success: false, error: "Tidak ada file yang diunggah." }, { status: 400 });
    }

    // SECURITY: File size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Ukuran file melebihi 5MB." }, { status: 400 });
    }

    // SECURITY: Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: `Tipe file '${file.type}' tidak diizinkan. Hanya JPEG, PNG, WebP, dan PDF.` }, { status: 400 });
    }

    // SECURITY: Validate file extension
    const originalName = file.name || "";
    const ext = originalName.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ success: false, error: `Ekstensi file '.${ext}' tidak diizinkan.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload dir if needed
    const uploadDir = join(process.cwd(), "public/uploads/proofs");
    await mkdir(uploadDir, { recursive: true });

    // SECURITY: Sanitize filename — strip everything except alphanumeric, dots, hyphens
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const path = join(uploadDir, uniqueName);

    await writeFile(path, buffer);

    // Return file path via custom dynamic file server
    return NextResponse.json({ success: true, url: `/api/file/proofs/${uniqueName}` });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses unggahan file ke dalam server." }, { status: 500 });
  }
}
