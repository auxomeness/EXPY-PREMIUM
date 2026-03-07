import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Expy</h2>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  );
}
