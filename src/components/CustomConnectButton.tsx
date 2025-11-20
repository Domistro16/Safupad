"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useENSName } from "@/hooks/useENSName";

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="controller-btn px-4 py-2 text-sm font-bold tracking-wide"
                  >
                    🎮 Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="controller-btn px-4 py-2 text-sm font-bold tracking-wide !bg-destructive"
                  >
                    ⚠️ Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex gap-2">
            

                  <AccountButton
                    address={account.address}
                    displayName={account.displayName}
                    onClick={openAccountModal}
                  />
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

interface AccountButtonProps {
  address: string;
  displayName: string;
  onClick: () => void;
}

function AccountButton({ address, displayName, onClick }: AccountButtonProps) {
  const { name, loading } = useENSName({ owner: address as `0x${string}` });

  // Use .safu name if available, otherwise fall back to displayName
  const finalDisplayName = name || displayName;

  return (
    <button
      onClick={onClick}
      type="button"
      className="controller-btn text-sm font-bold tracking-wide"
    >
      {loading ? "⏳ Loading..." : finalDisplayName.toLowerCase()}
    </button>
  );
}
