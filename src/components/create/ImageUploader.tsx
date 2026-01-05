"use client";

import { useState, useRef, useCallback } from "react";

interface ImageUploaderProps {
    /** Called when file is selected (with File object) or removed (with null) */
    onFileChange: (file: File | null) => void;
    /** Current preview URL (optional, for controlled mode) */
    currentPreview?: string | null;
    className?: string;
}

/**
 * ImageUploader component - shows preview only, does NOT upload automatically.
 * Parent component should handle the actual upload at form submission time.
 */
export function ImageUploader({
    onFileChange,
    currentPreview,
    className = "",
}: ImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(currentPreview || null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                setError("Please select an image file");
                return;
            }

            // Validate file size (500KB max)
            if (file.size > 500 * 1024) {
                setError("Image must be less than 500KB");
                return;
            }

            setError(null);

            // Create local preview (no upload yet)
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Pass file to parent - parent will upload at submit time
            onFileChange(file);
        },
        [onFileChange]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleRemove = () => {
        setPreview(null);
        setError(null);
        onFileChange(null);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    return (
        <div className={`rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-soft)] p-5 ${className}`}>
            <div className="text-sm font-semibold mb-3">Token Icon</div>

            {!preview ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`
            relative flex flex-col items-center justify-center w-full h-32
            border-2 border-dashed rounded-2xl cursor-pointer transition-all
            ${dragActive ? "border-[var(--accent-safu)] bg-[var(--accent-safu)]/10" : "border-[var(--border-soft)]"}
            hover:border-[var(--text)] hover:bg-[var(--surface)]
          `}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border-soft)] flex items-center justify-center text-lg">
                            📷
                        </div>
                        <span className="text-xs text-[var(--subtext)]">
                            Click or drag to select
                        </span>
                        <span className="text-[10px] text-[var(--subtext)]">
                            PNG, JPG, GIF, WebP (max 500KB)
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <img
                        src={preview}
                        alt="Token preview"
                        className="w-16 h-16 rounded-2xl object-cover border border-[var(--border-soft)]"
                    />
                    <div className="flex-1">
                        <div className="text-sm font-medium">Image selected</div>
                        <div className="text-xs text-[var(--subtext)]">
                            Will upload when you create the token
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="w-8 h-8 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] flex items-center justify-center text-[var(--subtext)] hover:text-[var(--text)] hover:bg-[var(--surface-soft)] transition"
                    >
                        ✕
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-3 text-xs text-red-500 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </div>
            )}
        </div>
    );
}

/**
 * Helper function to upload image to R2 with retry logic
 * Call this at token creation time
 * Retries up to 5 times before failing
 */
export async function uploadImageToR2(file: File, maxRetries: number = 5): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            return data.url;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Upload failed");
            console.warn(`Image upload attempt ${attempt}/${maxRetries} failed:`, lastError.message);

            // Wait before retrying (exponential backoff: 1s, 2s, 4s, 8s, 16s)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
            }
        }
    }

    throw lastError || new Error("Image upload failed after 5 attempts");
}

