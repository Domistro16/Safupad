"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Info, CheckCircle2, XCircle, Loader2, Upload, X } from "lucide-react";

interface ProjectRaiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectRaiseModal({ isOpen, onClose }: ProjectRaiseModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    targetAmount: "50",
    twitter: "",
    telegram: "",
    website: "",
    imageUrl: "",
    burnLP: false,
    vestingDuration: 6, // months, fixed at 6
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // lazy import to avoid tree-shake issues
  const { useBaldPadSDK } = require("@/lib/baldpad-sdk");
  const { sdk, isInitializing } = useBaldPadSDK();

  const TOTAL_SUPPLY = 1000000000; // 1 billion constant

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
    setError(null);
    setSuccess(false);
    setTxHash(null);

    // Basic validation
    if (!formData.name || !formData.symbol || !formData.targetAmount) {
      setError("Please fill in all required fields (name, symbol, target amount).");
      return;
    }

    const targetBNB = Number(formData.targetAmount);
    if (!Number.isFinite(targetBNB) || targetBNB < 50 || targetBNB > 500) {
      setError("Target amount must be between 50 BNB and 500 BNB.");
      return;
    }
    if (formData.vestingDuration !== 6) {
      setError("Vesting duration must be 6 months.");
      return;
    }

    if (!sdk) {
      setError("SDK not ready. Please connect your wallet and try again.");
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
          setError(err.message || "Failed to upload image");
          return;
        } finally {
          setImageUploading(false);
        }
      }

      // Ensure wallet is connected
      await sdk.connect();
      const founder = await sdk.getAddress();

      const metadata = {
        logoURI: imageUrl,
        description: formData.description || `${formData.name} (${formData.symbol}) project raise`,
        website: formData.website || "",
        twitter: formData.twitter || "",
        telegram: formData.telegram || "",
        discord: "",
      };

      // ✅ UPDATED for SDK v2.0.0: Use raiseTargetBNB and raiseMaxBNB instead of USD
      const params = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        totalSupply: TOTAL_SUPPLY,
        raiseTargetBNB: String(targetBNB), // ✅ Changed from raiseTargetUSD
        raiseMaxBNB: '500',    // ✅ Changed from raiseMaxUSD
        vestingDuration: formData.vestingDuration * 30,
        metadata,
        burnLP: formData.burnLP,
        maxContribution: '50000', // 50k MON max per contributor
      };

      const tx = await sdk.launchpad.createLaunch(params);
      setTxHash(tx.hash);
      await tx.wait();
      setSuccess(true);
    } catch (e: any) {
      const message = e?.message || "Failed to create project raise.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Project Raise</DialogTitle>
          <DialogDescription>
            Step {step} of 3: Fill in your token details
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>
              Project Raise submitted! Tx: {txHash ? (
                <a
                  className="underline"
                  href={sdk?.getExplorerUrl("tx", txHash) || "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  {txHash.slice(0, 10)}...
                </a>
              ) : (
                "Confirmed"
              )}
            </AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Raise window is 24 hours. Target between 50-500 BNB.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="name">Token Name *</Label>
              <Input
                id="name"
                placeholder="e.g., DeFi Warriors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Token Symbol *</Label>
              <Input
                id="symbol"
                placeholder="e.g., DWRR"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                maxLength={10}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                disabled={submitting || isInitializing}
              />
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
              <Label htmlFor="imageUpload">Token Image</Label>
              {!imagePreview ? (
                <div className="relative">
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={submitting || isInitializing || imageUploading}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUpload"
                    className={`
                      flex flex-col items-center justify-center w-full h-32 
                      border-2 border-dashed rounded-lg cursor-pointer
                      hover:bg-muted/50 transition-colors
                      ${imageUploading ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary/50'}
                      ${submitting || isInitializing ? 'opacity-50 cursor-not-allowed' : ''}
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
                      disabled={submitting || isInitializing || imageUploading}
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

            <Button onClick={() => setStep(2)} className="w-full controller-btn" disabled={submitting || isInitializing || imageUploading}>
              Continue to Raise Settings
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Set your fundraising target between 50 BNB and 500 BNB
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount (MON) *</Label>
              <Input
                id="targetAmount"
                type="number"
                min="50"
                max="500"
                step="10"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                disabled={submitting || isInitializing}
              />
              <Slider
                value={[parseFloat(formData.targetAmount)]}
                onValueChange={(value) => setFormData({ ...formData, targetAmount: value[0].toFixed(0) })}
                min={5000000}
                max={20000000}
                step={1000000}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                {parseFloat(formData.targetAmount).toFixed(0)} BNB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vestingDuration">
                Vesting Duration (Fixed)
              </Label>
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-lg font-semibold">6 months</p>
                <p className="text-xs text-muted-foreground mt-1">
                  60% released at raise end, rest released monthly over 6 months (if token stays above starting market cap)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="burnLP"
                  checked={formData.burnLP}
                  onChange={(e) => setFormData({ ...formData, burnLP: e.target.checked })}
                  disabled={submitting || isInitializing}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="burnLP" className="cursor-pointer">
                  Burn LP tokens after launch
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Burning LP tokens permanently locks liquidity, preventing removal and building trust with investors
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm mb-3">Token Distribution</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Community Allocation:</span>
                <span className="font-medium">20%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Liquidity Pool:</span>
                <span className="font-medium">20% of raised + 10% total supply</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Public Sale:</span>
                <span className="font-medium">70%</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm mb-3">LP Fee Distribution</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Founder (You):</span>
                <span className="font-medium">70% of LP Fees</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">InfoFi:</span>
                <span className="font-medium">20% of LP Fees</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform:</span>
                <span className="font-medium">10% of LP Fees</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-full controller-btn-outline" disabled={submitting || isInitializing}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="w-full controller-btn" disabled={submitting || isInitializing}>
                Continue to Social Links
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Social links help build trust with your community (optional but recommended)
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/yourproject"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                placeholder="https://t.me/yourproject"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                placeholder="https://yourproject.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={submitting || isInitializing}
              />
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">Review Your Launch</h4>
              <div className="text-sm space-y-1">
                <p><strong>Token:</strong> {formData.name} ({formData.symbol})</p>
                <p><strong>Supply:</strong> {TOTAL_SUPPLY.toLocaleString()}</p>
                <p><strong>Target:</strong> {parseFloat(formData.targetAmount).toFixed(0)} BNB</p>
                <p><strong>Vesting Duration:</strong> {formData.vestingDuration} month{formData.vestingDuration !== 1 ? 's' : ''}</p>
                <p><strong>Burn LP:</strong> {formData.burnLP ? 'Yes' : 'No'}</p>
                {imagePreview && <p><strong>Image:</strong> Uploaded ✓</p>}
                {txHash && (
                  <p>
                    <strong>Transaction:</strong>{" "}
                    <a
                      className="underline"
                      href={sdk?.getExplorerUrl("tx", txHash) || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {txHash}
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="w-full controller-btn-outline" disabled={submitting || isInitializing}>
                Back
              </Button>
              <Button onClick={handleSubmit} className="w-full controller-btn" disabled={submitting || isInitializing || imageUploading}>
                {submitting ? "Launching..." : "Launch Project Raise"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
















