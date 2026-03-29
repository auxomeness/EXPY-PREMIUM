type WalletLoaderProps = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

export function WalletLoader({
  title = "Expy",
  subtitle = "Loading...",
  compact = false,
}: WalletLoaderProps) {
  return (
    <div className={`wallet-loader-shell ${compact ? "wallet-loader-shell-compact" : ""}`}>
      <div className="wallet-loader-mark" aria-hidden="true">
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
      <div className="space-y-1 text-center">
        <h2 className={`${compact ? "text-lg" : "text-xl"} font-semibold tracking-[-0.02em] text-foreground`}>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
