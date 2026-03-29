import { WalletLoader } from "./WalletLoader";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center animate-in fade-in duration-200">
      <WalletLoader />
    </div>
  );
}
