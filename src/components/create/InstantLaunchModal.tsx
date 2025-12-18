"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from
  "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Zap, CheckCircle2, XCircle, Loader2, Upload, X } from "lucide-react";
import { useSafuPadSDK } from "@/lib/safupad-sdk";

interface InstantLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstantLaunchModal({ isOpen, onClose }: InstantLaunchModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    initialBuy: "0",
    twitter: "",
    telegram: "",
    imageUrl: ""
  });

  const TOTAL_SUPPLY = 1000000000; // 1 billion constant

  const { sdk, isInitializing, error: sdkError, connect } = useSafuPadSDK();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Handle image file selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      setImageUploadError('Image must be less than 500KB');
      return;
    }

    setImageFile(file);
    setImageUploadError(null);

    // Create preview only - don't upload yet
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const response = await fetch('https://safuserver-production.up.railway.app/api/nft/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_UPLOAD_KEY}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('No URL returned from upload');
      }

      return data.url;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to upload image');
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: "" });
    setImageUploadError(null);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setTxHash(null);

    // Basic validation
    if (!formData.name.trim() || !formData.symbol.trim() || !formData.description.trim()) {
      setSubmitError("Please fill in name, symbol, and description.");
      return;
    }
    if (formData.initialBuy === "" || Number(formData.initialBuy) < 0) {
      setSubmitError("Initial buy cannot be negative.");
      return;
    }

    if (!sdk) {
      setSubmitError("SDK not ready. Please ensure your wallet is available.");
      return;
    }

    try {
      setSubmitting(true);

      // Upload image right before creating launch
      let imageUrl = "";
      if (imageFile) {
        setImageUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (err: any) {
          setSubmitError(err.message || "Failed to upload image");
          return;
        } finally {
          setImageUploading(false);
        }
      }

      // Ensure wallet is connected to provide signer
      const address = await connect();
      if (!address) {
        throw new Error("Wallet not connected.");
      }

      // Prepare params per SDK types
      const params = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        totalSupply: TOTAL_SUPPLY,
        metadata: {
          logoURI: imageUrl,
          description: formData.description.trim(),
          website: "",
          twitter: formData.twitter.trim(),
          telegram: formData.telegram.trim(),
          discord: ""
        },
        initialBuyBNB: formData.initialBuy,
        burnLP: false
      } as const;

      const tx = await sdk.launchpad.createInstantLaunch(params);
      setTxHash(tx.hash);
      // Wait for confirmation
      await tx.wait();
      onClose();
    } catch (e: any) {
      setSubmitError(e?.message || "Instant launch failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Instant Launch
          </DialogTitle>
          <DialogDescription>
            Your token will be live immediately after creation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="!whitespace-pre-line !whitespace-pre-line">No approval needed! Your token goes live instantly. 2.0% trading fee: 1% to you, 0.9% to InfoFi platform, 0.1% platform fee.

            </AlertDescription>
          </Alert>

          {sdkError &&
            <Alert>
              <AlertDescription>
                SDK error: {String((sdkError as any)?.message || sdkError)}
              </AlertDescription>
            </Alert>
          }

          {submitError &&
            <Alert>
              <AlertDescription>
                {submitError}
              </AlertDescription>
            </Alert>
          }

          {txHash &&
            <Alert>
              <AlertDescription>
                Transaction submitted: {txHash}
              </AlertDescription>
            </Alert>
          }

          <div className="space-y-2">
            <Label htmlFor="name">Token Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Moon Rocket"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={submitting} />

          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">Token Symbol *</Label>
            <Input
              id="symbol"
              placeholder="e.g., MOON"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              maxLength={10}
              disabled={submitting} />

          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Tell the community about your token..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={submitting} />

          </div>

          <div className="space-y-2">
            <Label>Total Supply</Label>
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-lg font-semibold">{TOTAL_SUPPLY.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Fixed supply of 1 billion tokens
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBuy">Initial Buy (BNB) *</Label>
            <Input
              id="initialBuy"
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              value={formData.initialBuy}
              onChange={(e) => setFormData({ ...formData, initialBuy: e.target.value })}
              disabled={submitting} />

            <p className="text-xs text-muted-foreground">
              You may buy 0 BNB to start; higher buys can improve initial liquidity.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUpload">Token Image</Label>
            {!imagePreview ? (
              <div className="relative">
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={submitting || imageUploading}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className={`
                    flex flex-col items-center justify-center w-full h-32 
                    border-2 border-dashed rounded-lg cursor-pointer
                    hover:bg-muted/50 transition-colors
                    ${imageUploading ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary/50'}
                    ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {imageUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload token image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF (max 500KB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="relative w-full border border-border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={imagePreview}
                    alt="Token preview"
                    className="w-20 h-20 rounded-lg object-cover border border-border"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{imageFile?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {imageFile && `${(imageFile.size / 1024).toFixed(2)} KB`}
                    </p>
                    {formData.imageUrl && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500">Uploaded successfully</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={submitting || imageUploading}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {imageUploadError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {imageUploadError}
              </p>
            )}
            {!imageUploadError && !imagePreview && (
              <p className="text-xs text-muted-foreground">
                Upload an image for your token (optional but recommended)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter (optional)</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/..."
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                disabled={submitting} />

            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (optional)</Label>
              <Input
                id="telegram"
                placeholder="https://t.me/..."
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                disabled={submitting} />

            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Trading Fee Structure (2% total)</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creator (You):</span>
              <span className="font-medium">1.0%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">InfoFi:</span>
              <span className="font-medium">0.6%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">EduFi Incentives:</span>
              <span className="font-medium">0.3%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform:</span>
              <span className="font-medium">0.1%</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Bonding Distribution</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creator (You):</span>
              <span className="font-medium">70%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">InfoFi:</span>
              <span className="font-medium">20%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform:</span>
              <span className="font-medium">10%</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Graduation</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonding Curve Cap:</span>
              <span className="font-medium">50 BNB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Graduation Fee:</span>
              <span className="font-medium">1% pool (50/50 creator/platform)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">After Graduation:</span>
              <span className="font-medium !whitespace-pre-line">Listed on PancakeSwap</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-3">Creator Benefits</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trading Fee Share:</span>
              <span className="font-medium !whitespace-pre-line">2% per trade</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Claim Cooldown:</span>
              <span className="font-medium">24 hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Claim Requirement:</span>
              <span className="font-medium">Maintain graduation market cap</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dashboard Access:</span>
              <span className="font-medium">Dedicated InfoFi dashboard</span>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Instant Launch Summary</h4>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Token:</strong> {formData.name || "---"} ({formData.symbol || "---"})</p>
              <p><strong>Supply:</strong> {TOTAL_SUPPLY.toLocaleString()}</p>
              <p><strong>Initial Buy:</strong> {formData.initialBuy} BNB</p>
              {imagePreview && <p><strong>Image:</strong> Uploaded ✓</p>}
              <p><strong>Status:</strong> <span className="text-primary">Goes live immediately</span></p>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full controller-btn"
            size="lg"
            disabled={submitting || isInitializing || imageUploading}
          >
            <Zap className="w-4 h-4 mr-2" />
            {submitting ? "Creating..." : "Create & Launch Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}