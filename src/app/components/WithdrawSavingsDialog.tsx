import { useState } from "react";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import type { CurrencySettings } from "../App";
import { convertToBaseCurrency, formatUserCurrency } from "../utils/currency";

type WithdrawSavingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (amount: number) => void;
  currentSavings: number;
  currencySettings: CurrencySettings;
};

export function WithdrawSavingsDialog({ 
  open, 
  onOpenChange, 
  onWithdraw,
  currentSavings,
  currencySettings,
}: WithdrawSavingsDialogProps) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (convertToBaseCurrency(amountNum, currencySettings) > currentSavings) {
      toast.error("Insufficient savings");
      return;
    }

    onWithdraw(amountNum);
    setAmount("");
    toast.success("Withdrawn from savings successfully");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Withdraw from Savings</DrawerTitle>
          <DrawerDescription>Move money back into your main balance.</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-2">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount ({currencySettings.preferredCurrency})</Label>
            <Input
              id="withdraw-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Current savings: {formatUserCurrency(currentSavings, currencySettings)}
            </p>
          </div>

          <DrawerFooter className="px-0 pt-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Withdraw
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
