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
                    className="relative px-6 py-3 bg-gradient-to-b from-[#836ef9] to-[#6b5cd9] border-2 border-[#a893ff] rounded-2xl text-[#0a0a0f] font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_20px_rgba(131,110,249,0.4)] hover:shadow-[0_6px_0_rgba(0,0,0,0.3),0_0_30px_rgba(131,110,249,0.6)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_15px_rgba(131,110,249,0.3)]"
                  >
                    <span className="relative z-10">Connect Wallet</span>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
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
                <div className="flex gap-2">
                  {chain && (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="relative px-3 py-2.5 bg-gradient-to-b from-[rgba(131,110,249,0.25)] to-[rgba(107,92,217,0.15)] border-2 border-[rgba(168,147,255,0.4)] rounded-xl text-[#a893ff] font-bold text-sm uppercase tracking-wide transition-all duration-200 shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_15px_rgba(131,110,249,0.25)] hover:shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_20px_rgba(131,110,249,0.4)] hover:-translate-y-0.5 active:translate-y-0.5 flex items-center gap-2"
                    >
                      {chain.hasIcon && (
                        <div
                          className="w-5 h-5 rounded-full overflow-hidden border border-[rgba(168,147,255,0.3)]"
                          style={{
                            background: chain.iconBackground,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="w-5 h-5"
                            />
                          )}
                        </div>
                      )}
                      <span className="relative z-10">{chain.name}</span>
                    </button>
                  )}

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
      className="relative px-4 py-2.5 bg-gradient-to-b from-[rgba(131,110,249,0.25)] to-[rgba(107,92,217,0.15)] border-2 border-[rgba(168,147,255,0.4)] rounded-xl text-[#a893ff] font-bold text-sm uppercase tracking-wide transition-all duration-200 shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_15px_rgba(131,110,249,0.25)] hover:shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_20px_rgba(131,110,249,0.4)] hover:-translate-y-0.5 active:translate-y-0.5"
    >
      <span className="relative z-10">
        {loading ? "Loading..." : finalDisplayName}
      </span>
    </button>
  );
}
