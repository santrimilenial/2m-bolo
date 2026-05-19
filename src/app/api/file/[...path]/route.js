import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, resolve } from "path";

const ALLOWED_EXTENSIONS = new Set(["jpeg", "jpg", "png", "webp", "pdf"]);

const mimeTypes = {
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "webp": "image/webp",
  "pdf": "application/pdf"
};

export async function GET(request, { params }) {
  try {
    const pathArray = params.path || [];

    // SECURITY: Block path traversal — no segment can contain '..'
    for (const segment of pathArray) {
      if (segment.includes("..") || segment.includes("~") || segment.startsWith(".")) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const uploadsDir = join(process.cwd(), "public/uploads");
    const filePath = resolve(uploadsDir, ...pathArray);

    // SECURITY: Ensure resolved path is still inside uploads dir
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // SECURITY: Only allow whitelisted extensions
    const ext = filePath.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return new NextResponse("Forbidden: File type not allowed", { status: 403 });
    }

    const contentType = mimeTypes[ext] || "application/octet-stream";
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return new NextResponse("File Not Found", { status: 404 });
  }
}
