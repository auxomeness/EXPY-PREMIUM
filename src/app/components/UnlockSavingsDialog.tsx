import { useState } from "react";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

type UnlockSavingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: (password: string) => boolean;
};

export function UnlockSavingsDialog({ 
  open, 
  onOpenChange, 
  onUnlock 
}: UnlockSavingsDialogProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    const success = onUnlock(password);
    
    if (success) {
      setPassword("");
      onOpenChange(false);
    } else {
      setPassword("");
      toast.error("Incorrect password");
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Unlock Savings</DrawerTitle>
          <DrawerDescription>Enter your password to continue.</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-2">
          <div className="space-y-2">
            <Label htmlFor="unlock-password">Password</Label>
            <Input
              id="unlock-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          <DrawerFooter className="px-0 pt-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setPassword("");
                onOpenChange(false);
              }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Unlock
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
