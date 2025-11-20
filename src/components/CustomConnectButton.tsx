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
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex gap-3">
                  {chain && (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-3 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                      {chain.hasIcon && (
                        <div
                          className="w-5 h-5 rounded-full overflow-hidden bg-white/10"
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
                      <span className="text-sm">{chain.name}</span>
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
      className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
    >
      <span className="text-sm">
        {loading ? "Loading..." : finalDisplayName}
      </span>
    </button>
  );
}
