"use client";

import { useState, useEffect } from "react";
import { Token } from "@/types/token";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, TrendingUp, Info, Loader2, Clock, Trophy, Coins, Flame, DollarSign, XCircle } from "lucide-react";
import { formatCurrency, getProgressPercentage } from "@/lib/utils/format";
import { useBaldPadSDK } from "@/lib/baldpad-sdk";
import { ethers } from "ethers";
import { toast } from "sonner";
import { useAccount } from 'wagmi';

interface ContributeInterfaceProps {
  token: Token;
}

export function ContributeInterface({ token }: ContributeInterfaceProps) {
  const { sdk } = useBaldPadSDK();
  const { address } = useAccount();
  const [contribution, setContribution] = useState("");
  const [isContributing, setIsContributing] = useState(false);
  const [isGraduating, setIsGraduating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [monBalance, setBnbBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [monRaised, setBnbRaised] = useState<number>(0);
  const [monTarget, setBnbTarget] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [raiseCompleted, setRaiseCompleted] = useState(false);
  const [raiseFailed, setRaiseFailed] = useState(false);

  const isProjectRaise = token.launchType === "project-raise";
  const projectRaise = token.projectRaise;

  // Check if raise is completed
  useEffect(() => {
    let cancelled = false;

    const checkRaiseStatus = async () => {
      if (!sdk || !isProjectRaise) return;

      try {
        const launchInfo = await sdk.launchpad.getLaunchInfoWithUSD(token.id);
        const raiseComplete = Boolean(launchInfo.raiseCompleted);

        if (!cancelled) {
          setRaiseCompleted(raiseComplete);
        }
      } catch (error) {
        console.error("Error checking raise status:", error);
      }
    };

    checkRaiseStatus();

    // Poll every 5 seconds
    const interval = setInterval(checkRaiseStatus, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sdk, token.id, isProjectRaise]);

  // Fetch BNB balance
  useEffect(() => {
    let cancelled = false;

    const fetchBalance = async () => {
      if (!sdk || !address) {
        setLoadingBalance(true);
        return;
      }

      try {
        setLoadingBalance(true);
        const provider = new ethers.JsonRpcProvider("https://mon-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv");
        const monBal = await provider.getBalance(address);
        if (!cancelled) {
          setBnbBalance(ethers.formatEther(monBal));
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
        if (!cancelled) {
          setBnbBalance("0");
        }
      } finally {
        if (!cancelled) {
          setLoadingBalance(false);
        }
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sdk, address]);

  // Convert USD values to BNB for display
  useEffect(() => {
    const loadBnbValues = async () => {
      if (!sdk || !projectRaise) return;

      try {
        const raisedBNB = await sdk.priceOracle.usdToBNB(
          ethers.parseEther(projectRaise.raisedAmount.toString())
        );
        const targetBNB = await sdk.priceOracle.usdToBNB(
          ethers.parseEther(projectRaise.targetAmount.toString())
        );

        setBnbRaised(Number(ethers.formatEther(raisedBNB)));
        setBnbTarget(Number(ethers.formatEther(targetBNB)));
      } catch (error) {
        console.error("Error converting to BNB:", error);
      }
    };

    void loadBnbValues();
  }, [sdk, projectRaise]);

  // Calculate time remaining and check for failed raise
  useEffect(() => {
    if (!projectRaise?.endTime) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(projectRaise.endTime);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Ended");
        // Check if raise failed: time ended but not completed
        if (!raiseCompleted) {
          setRaiseFailed(true);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [projectRaise?.endTime, raiseCompleted]);

  const raiseProgress = isProjectRaise && projectRaise
    ? getProgressPercentage(projectRaise.raisedAmount, projectRaise.targetAmount)
    : 0;

  const simulateContribution = async (tokenAddress: string, monAmount: string) => {
    try {
      const signer = await sdk!.provider.getSigner();
      const signerAddress = await signer.getAddress();

      const iface = new ethers.Interface([
        'function contribute(address token) payable'
      ]);
      const data = iface.encodeFunctionData('contribute', [tokenAddress]);

      console.log('🔍 Simulating contribution...');
      await sdk!.provider.call({
        from: signerAddress,
        to: sdk!.launchpad.address,
        data: data,
        value: ethers.parseEther(monAmount)
      });

      console.log('✅ Simulation successful!');
      return true;
    } catch (error: any) {
      console.log('❌ Simulation failed!');
      console.error('Error:', error);

      if (error.data) {
        try {
          const reason = ethers.toUtf8String('0x' + error.data.slice(138));
          console.log('Decoded reason:', reason);
        } catch { }
      }

      return false;
    }
  };

  const handleContribute = async () => {
    const amountBNB = Number(contribution);
    if (!amountBNB || amountBNB <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    if (amountBNB < 0.01) {
      toast.error("Minimum contribution is 0.01 BNB");
      return;
    }

    if (!sdk) {
      toast.error("SDK not ready. Please ensure your wallet is connected.");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsContributing(true);

      // Simulate first
      const simSuccess = await simulateContribution(token.id, amountBNB.toString());

      if (!simSuccess) {
        toast.error("Transaction simulation failed. Please check the console for details.");
        return;
      }

      // Execute contribution
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const launchpad = new ethers.Contract(
        sdk.launchpad.address,
        [{
          "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
          "name": "contribute",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        }],
        signer
      );

      const tx = await launchpad.contribute(token.id, {
        value: ethers.parseEther(amountBNB.toString())
      });

      toast.success("Transaction submitted! Waiting for confirmation...");
      await tx.wait();

      toast.success(`Successfully contributed ${amountBNB} BNB to ${token.symbol}!`);

      // Reset form and refresh balance
      setContribution("");
      const monBal = await provider.getBalance(address);
      setBnbBalance(ethers.formatEther(monBal));

      // Refresh page to show updated raise amounts
      setTimeout(() => window.location.reload(), 2000);

    } catch (err: any) {
      console.error("Contribution failed:", err);
      toast.error(err?.message || "Contribution failed. Please try again.");
    } finally {
      setIsContributing(false);
    }
  };

  const handleGraduate = async () => {
    if (!sdk) {
      toast.error("SDK not initialized");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsGraduating(true);

    try {
      // Call sdk.launchpad.graduateToPancakeSwap(tokenAddress)
      toast.success("Graduating to PancakeSwap! Waiting for confirmation...");

      const tx = await sdk.launchpad.graduateToPancakeSwap(token.id);
      await tx.wait();

      toast.success(`${token.symbol} has graduated to PancakeSwap! 🎉`);

      // Reload page to show updated status
      setTimeout(() => window.location.reload(), 2000);

    } catch (err: any) {
      console.error("Graduation to PancakeSwap failed:", err);
      toast.error(err?.message || "Graduation to PancakeSwap failed. Please try again.");
    } finally {
      setIsGraduating(false);
    }
  };

  const handleClaimTokens = async () => {
    if (!sdk) {
      toast.error("SDK not initialized");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsClaiming(true);

    try {
      // Call sdk.launchpad.claimContributorTokens(tokenAddress)
      toast.success("Claiming tokens! Waiting for confirmation...");

      const tx = await sdk.launchpad.claimContributorTokens(token.id);
      await tx.wait();

      toast.success(`Successfully claimed ${token.symbol} tokens! 🎉`);

      // Reload page to show updated balances
      setTimeout(() => window.location.reload(), 2000);

    } catch (err: any) {
      console.error("Claim failed:", err);
      toast.error(err?.message || "Claim failed. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!sdk) {
      toast.error("SDK not initialized");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsBurning(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const launchpad = new ethers.Contract(
        sdk.launchpad.address,
        [{
          "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
          "name": "burnFailedRaiseTokens",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        signer
      );

      const tx = await launchpad.burnFailedRaiseTokens(token.id);
      toast.success("Burn transaction initiated! Waiting for confirmation...");

      await tx.wait();
      toast.success(`Tokens from failed raise have been burned! 🔥`);

      // Reload page
      setTimeout(() => window.location.reload(), 2000);

    } catch (err: any) {
      console.error("Burn failed:", err);
      toast.error(err?.message || "Burn failed. Please try again.");
    } finally {
      setIsBurning(false);
    }
  };

  const handleClaimRefund = async () => {
    if (!sdk) {
      toast.error("SDK not initialized");
      return;
    }

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsRefunding(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const launchpad = new ethers.Contract(
        sdk.launchpad.address,
        [{
          "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
          "name": "claimRefund",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }],
        signer
      );

      const tx = await launchpad.claimRefund(token.id);
      toast.success("Refund claim initiated! Waiting for confirmation...");

      await tx.wait();
      toast.success(`Successfully claimed your refund! 💰`);

      // Reload page to show updated balances
      setTimeout(() => window.location.reload(), 2000);

    } catch (err: any) {
      console.error("Refund claim failed:", err);
      toast.error(err?.message || "Refund claim failed. Please try again.");
    } finally {
      setIsRefunding(false);
    }
  };

  const formatBalance = (balance: string | null, loading: boolean) => {
    if (loading) return "Loading...";
    if (balance === null) return "0.00";
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  if (!isProjectRaise || !projectRaise) {
    return null;
  }

  return (
    <Card className="p-6 sticky top-24">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {raiseFailed ? (
              <XCircle className="w-6 h-6 text-destructive" />
            ) : raiseCompleted ? (
              <Trophy className="w-6 h-6 text-primary" />
            ) : (
              <Zap className="w-6 h-6 text-primary" />
            )}
            <h3 className="text-2xl font-black">
              {raiseFailed ? "RAISE FAILED" : raiseCompleted ? "RAISE COMPLETE" : "CONTRIBUTE"}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {raiseFailed
              ? "Raise target not reached. Claim your refund or burn tokens."
              : raiseCompleted
                ? "Ready to graduate to trading phase!"
                : "Power up this raise. Be part of the mission!"}
          </p>
        </div>

        {/* Time Remaining */}
        {!raiseCompleted && !raiseFailed && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold text-muted-foreground uppercase">Time Remaining</span>
            </div>
            <p className="text-2xl font-black tracking-wide text-primary">
              {timeRemaining}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Raise Progress
            </span>
            <span className="font-black text-primary">{raiseProgress.toFixed(1)}%</span>
          </div>
          <div className="h-4 w-full bg-input pixel-corners overflow-hidden">
            <div
              className={`h-full ${raiseFailed ? 'bg-destructive/50' : 'bg-gradient-to-r from-primary to-secondary energy-bar'}`}
              style={{ width: `${Math.min(raiseProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Raised</p>
              <p className="font-bold">{monRaised.toFixed(4)} BNB</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(projectRaise.raisedAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="font-bold">{monTarget.toFixed(4)} BNB</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(projectRaise.targetAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Conditional Content - Show different UI based on raise status */}
        {raiseFailed ? (
          <>
            {/* Failed Raise Alert */}
            <Alert className="bg-destructive/10 border-destructive/30">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                ⚠️ The raise target was not reached within the time window. Contributors can claim refunds.
              </AlertDescription>
            </Alert>

            {/* Failed Raise Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleBurnTokens}
                className="controller-btn w-full flex items-center justify-center gap-2 !bg-gradient-to-b from-destructive/90 to-destructive/70 hover:from-destructive hover:to-destructive/80"
                disabled={isBurning}
              >
                {isBurning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Burning...
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    Burn Tokens
                  </>
                )}
              </button>

              <button
                onClick={handleClaimRefund}
                className="controller-btn-outline controller-btn w-full flex items-center justify-center gap-2"
                disabled={isRefunding}
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Claiming Refund...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Claim Refund
                  </>
                )}
              </button>
            </div>
          </>
        ) : raiseCompleted ? (
          <>
            {/* Success Alert */}
            <Alert className="bg-primary/10 border-primary/30">
              <Trophy className="h-4 w-4" />
              <AlertDescription className="text-xs">
                🎉 Raise goal achieved! Graduate the token to activate trading, or claim your tokens.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGraduate}
                className="controller-btn w-full flex items-center justify-center gap-2"
                disabled={isGraduating}
              >
                {isGraduating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Graduating...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    Graduate to Trading
                  </>
                )}
              </button>

              <button
                onClick={handleClaimTokens}
                className="controller-btn-outline controller-btn w-full flex items-center justify-center gap-2"
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    Claim Tokens
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Info Alert */}
            <Alert className="bg-primary/10 border-primary/30">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Higher contributions boost progress faster. Once the target is reached, the token goes live!
              </AlertDescription>
            </Alert>

            {/* Contribution Input */}
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Contribution Amount (BNB)</Label>
              <Input
                id="contribution-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.01"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                className="bg-card/60 border-primary/30 text-lg font-mono"
                disabled={isContributing}
                step="0.01"
                min="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Balance: {formatBalance(monBalance, loadingBalance)} BNB
              </p>
              <p className="text-xs text-muted-foreground">
                Minimum: 0.01 BNB
              </p>
            </div>

            {/* Quick Contribution Buttons */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick Contribution</p>
              <div className="grid grid-cols-4 gap-2">
                {["0.1", "0.5", "1", "5"].map((val) => (
                  <button
                    key={val}
                    className="dpad-btn text-xs py-2"
                    onClick={() => setContribution(val)}
                    disabled={isContributing}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Contribution Details */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
              <h4 className="font-bold text-xs text-muted-foreground uppercase mb-3">
                Your Contribution
              </h4>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="font-medium">{token.name} ({token.symbol})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary">{contribution || "0"} BNB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-primary">Project Raise</span>
              </div>
            </div>

            {/* Contribute Button */}
            <button
              onClick={handleContribute}
              className="controller-btn w-full flex items-center justify-center gap-2"
              disabled={isContributing || !contribution || Number(contribution) <= 0 || Number(contribution) < 0.01}
            >
              {isContributing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Contributing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Confirm Contribution
                </>
              )}
            </button>
          </>
        )}

        {/* Raise Info */}
        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="font-bold text-xs text-muted-foreground uppercase">
            Raise Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Range</span>
              <span className="font-medium">5m-20m BNB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Raise Window</span>
              <span className="font-medium">72 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Community Allocation</span>
              <span className="font-medium">20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Liquidity</span>
              <span className="font-medium">20% raised + 10% supply</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}