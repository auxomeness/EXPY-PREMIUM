import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

type AddSavingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSavings: (amount: number) => void;
  currentBalance: number;
};

export function AddSavingsDialog({ 
  open, 
  onOpenChange, 
  onAddSavings,
  currentBalance 
}: AddSavingsDialogProps) {
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountNum > currentBalance) {
      toast.error("Insufficient balance");
      return;
    }

    onAddSavings(amountNum);
    setAmount("");
    toast.success("Savings added successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Savings</DialogTitle>
          <DialogDescription>
            Transfer money from your balance to savings
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="savings-amount">Amount (₱)</Label>
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
              Current balance: ₱{currentBalance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add to Savings
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
