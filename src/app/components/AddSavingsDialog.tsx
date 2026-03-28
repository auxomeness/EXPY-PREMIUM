import { useState } from "react";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import type { CurrencySettings } from "../App";
import { convertToBaseCurrency, formatUserCurrency } from "../utils/currency";

type AddSavingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSavings: (amount: number) => void;
  currentBalance: number;
  currencySettings: CurrencySettings;
};

export function AddSavingsDialog({ 
  open, 
  onOpenChange, 
  onAddSavings,
  currentBalance,
  currencySettings,
}: AddSavingsDialogProps) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (convertToBaseCurrency(amountNum, currencySettings) > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    onAddSavings(amountNum);
    setAmount("");
    toast.success("Savings added successfully");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add to Savings</DrawerTitle>
          <DrawerDescription>Move money into savings.</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-2">
          <div className="space-y-2">
            <Label htmlFor="savings-amount">Amount ({currencySettings.preferredCurrency})</Label>
            <Input
              id="savings-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Current balance: {formatUserCurrency(currentBalance, currencySettings)}
            </p>
          </div>

          <DrawerFooter className="px-0 pt-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add to Savings
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
