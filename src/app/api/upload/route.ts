import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Allowed image types
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 500 * 1024; // 500KB

// Create S3 client lazily to ensure env vars are loaded
function getS3Client() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error("R2 credentials not configured");
    }

    return new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
        forcePathStyle: true, // Required for R2 compatibility
    });
}

export async function POST(request: NextRequest) {
    try {
        // Get env vars
        const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "safupad-uploads";
        const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";
        const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

        // Check if R2 is configured
        if (!R2_ACCOUNT_ID) {
            return NextResponse.json(
                { error: "R2 storage not configured. Please add CLOUDFLARE_ACCOUNT_ID to .env.local" },
                { status: 500 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size: 500KB" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split(".").pop() || "png";
        const filename = `tokens/${timestamp}-${randomId}.${extension}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get client and upload
        const s3Client = getS3Client();
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        // Construct public URL
        // For R2, public access URL format is: https://pub-<hash>.r2.dev/<key>
        // Or custom domain if configured
        const publicUrl = R2_PUBLIC_URL
            ? `${R2_PUBLIC_URL}/${filename}`
            : `https://pub-${R2_ACCOUNT_ID}.r2.dev/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename,
        });
    } catch (error: any) {
        console.error("Upload error:", error);

        // Provide more helpful error messages
        let errorMessage = error.message || "Upload failed";
        if (error.code === "EPROTO" || errorMessage.includes("SSL") || errorMessage.includes("handshake")) {
            errorMessage = "SSL connection error. Please check your CLOUDFLARE_ACCOUNT_ID is correct.";
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
