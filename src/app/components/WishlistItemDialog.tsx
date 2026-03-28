import { useEffect, useState } from "react";
import type { CurrencySettings, WishlistItem } from "../App";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { convertFromBaseCurrency, convertToBaseCurrency, formatCurrency } from "../utils/currency";
import { generateEntityId } from "../utils/userData";
import { toast } from "sonner";

type WishlistItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySettings: CurrencySettings;
  item?: WishlistItem | null;
  onSave: (item: WishlistItem) => void;
};

export function WishlistItemDialog({
  open,
  onOpenChange,
  currencySettings,
  item,
  onSave,
}: WishlistItemDialogProps) {
  const [name, setName] = useState("");
  const [targetCost, setTargetCost] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(item?.name || "");
    setTargetCost(
      item ? convertFromBaseCurrency(item.targetCost, currencySettings).toFixed(2) : "",
    );
  }, [currencySettings, item, open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedTargetCost = parseFloat(targetCost);

    if (!trimmedName) {
      toast.error("Please enter an item name");
      return;
    }

    if (Number.isNaN(parsedTargetCost) || parsedTargetCost <= 0) {
      toast.error("Please enter a valid target cost");
      return;
    }

    const now = new Date().toISOString();

    onSave({
      id: item?.id || generateEntityId("wishlist"),
      name: trimmedName,
      targetCost: convertToBaseCurrency(parsedTargetCost, currencySettings),
      createdAt: item?.createdAt || now,
      updatedAt: now,
    });

    onOpenChange(false);
    toast.success(item ? "Wishlist item updated" : "Wishlist item added");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{item ? "Edit Wishlist Item" : "Add Wishlist Item"}</DrawerTitle>
          <DrawerDescription>Track a target against your current savings.</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-2">
          <div className="space-y-2">
            <Label htmlFor="wishlist-name">Item name</Label>
            <Input
              id="wishlist-name"
              placeholder="Headphones, desk, trip..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wishlist-target-cost">Target cost</Label>
            <Input
              id="wishlist-target-cost"
              type="number"
              step="0.01"
              min="0"
              placeholder={formatCurrency(0, currencySettings.preferredCurrency)}
              value={targetCost}
              onChange={(event) => setTargetCost(event.target.value)}
              required
            />
          </div>

          <DrawerFooter className="px-0 pt-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {item ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
