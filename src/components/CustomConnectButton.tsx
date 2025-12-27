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
                    className="login-btn"
                  >
                    Login
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="relative px-6 py-3 bg-gradient-to-b from-[#ff0055] to-[#cc0044] border-2 border-red-400 rounded-2xl text-white font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_20px_rgba(255,0,85,0.4)] hover:shadow-[0_6px_0_rgba(0,0,0,0.3),0_0_30px_rgba(255,0,85,0.6)] hover:-translate-y-0.5 active:translate-y-1"
                  >
                    <span className="relative z-10">Wrong Network</span>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
                  </button>
                );
              }

              return (
                <AccountButton
                  address={account.address}
                  displayName={account.displayName}
                  onClick={openAccountModal}
                />
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

  // Use .safu name if available, otherwise show wallet address
  // Show wallet address immediately while loading, then update if .safu name is found
  const finalDisplayName = name || displayName;

  return (
    <button
      onClick={onClick}
      type="button"
      className="login-btn"
    >
      {finalDisplayName}
    </button>
  );
}
