import { useState } from "react";
import { Plus, type LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";

type QuickActionFabProps = {
  items: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    onSelect: () => void;
    disabled?: boolean;
    variant?: "default" | "outline";
  }>;
};

export function QuickActionFab({ items }: QuickActionFabProps) {
  const [open, setOpen] = useState(false);

  const runAndClose = (callback: () => void) => {
    setOpen(false);
    window.setTimeout(callback, 120);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="floating-nav-fab fixed bottom-[calc(0.82rem+env(safe-area-inset-bottom))] right-[max(0.9rem,calc((100vw-430px)/2+0.9rem))] z-40 flex h-[4.55rem] w-[4.55rem] items-center justify-center rounded-[1.85rem] transition-transform active:scale-[0.98]"
        >
          <Plus className="h-7 w-7" strokeWidth={2.2} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Quick Actions</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 px-5 pb-5">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Button key={item.id} className="w-full justify-start" variant={item.variant ?? "outline"} onClick={() => runAndClose(item.onSelect)} disabled={item.disabled}>
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
