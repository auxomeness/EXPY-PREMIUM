type WalletLoaderProps = {
  compact?: boolean;
};

export function WalletLoader({ compact = false }: WalletLoaderProps) {
  return (
    <div className={`wallet-loader-shell ${compact ? "wallet-loader-shell-compact" : ""}`}>
      <div className={`wallet-loader-mark ${compact ? "wallet-loader-mark-compact" : ""}`} aria-hidden="true">
        <div className="wallet-loader-cards">
          <div className="wallet-loader-card wallet-loader-card-back">
            <span className="wallet-loader-card-chip" />
          </div>
          <div className="wallet-loader-card wallet-loader-card-mid">
            <span className="wallet-loader-card-chip" />
          </div>
          <div className="wallet-loader-card wallet-loader-card-front">
            <span className="wallet-loader-card-chip" />
          </div>
        </div>
        <div className="wallet-loader-wallet">
          <div className="wallet-loader-wallet-back" />
          <div className="wallet-loader-wallet-front" />
          <div className="wallet-loader-wallet-pocket" />
          <div className="wallet-loader-wallet-button" />
        </div>
      </div>
    </div>
  );
}
