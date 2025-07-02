import { useAccount, useConnect, useDisconnect } from "wagmi";

function formatAddress(address?: `0x${string}`) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, isConnecting, isReconnecting, isConnected } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const primaryConnector = connectors[0];
  const disabled =
    !primaryConnector || isConnecting || isReconnecting || isPending;

  if (isConnected) {
    return (
      <button
        type="button"
        className="wallet-button wallet-button-connected"
        onClick={() => disconnect()}
      >
        {formatAddress(address) || "Connected"}
      </button>
    );
  }

  return (
    <div className="wallet-connect-wrapper">
      <button
        type="button"
        className="wallet-button"
        disabled={disabled}
        onClick={() => {
          if (primaryConnector) {
            connect({ connector: primaryConnector });
          }
        }}
      >
        {isPending || isConnecting || isReconnecting
          ? "Connecting…"
          : "Connect Wallet"}
      </button>
      {error && <span className="wallet-error">{error.message}</span>}
    </div>
  );
}

