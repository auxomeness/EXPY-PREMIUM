import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

type WithdrawSavingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw: (amount: number) => void;
  currentSavings: number;
};

export function WithdrawSavingsDialog({ 
  open, 
  onOpenChange, 
  onWithdraw,
  currentSavings 
}: WithdrawSavingsDialogProps) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountNum > currentSavings) {
      toast.error("Insufficient savings");
      return;
    }

    onWithdraw(amountNum);
    setAmount("");
    toast.success("Withdrawn from savings successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw from Savings</DialogTitle>
          <DialogDescription>
            Transfer money from your savings back to your balance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount (₱)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Current savings: ₱{currentSavings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Withdraw
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
