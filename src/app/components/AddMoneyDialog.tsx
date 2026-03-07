import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { formatCurrency } from "../utils/currency";
import type { BudgetPeriod } from "../App";

type AddMoneyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMoney: (amount: number, period: BudgetPeriod) => void;
};

export function AddMoneyDialog({ open, onOpenChange, onAddMoney }: AddMoneyDialogProps) {
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("monthly");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    onAddMoney(amountNum, period);
    setAmount("");
    setPeriod("monthly");
    toast.success(`${formatCurrency(amountNum)} added to your ${period} balance`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Money</DialogTitle>
          <DialogDescription>
            Add funds to your account balance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period">Budget Period</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as BudgetPeriod)}>
              <SelectTrigger id="period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Budget</SelectItem>
                <SelectItem value="weekly">Weekly Budget</SelectItem>
                <SelectItem value="monthly">Monthly Budget</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {period === "daily" && "This amount is for one day"}
              {period === "weekly" && "This amount is for one week (7 days)"}
              {period === "monthly" && "This amount is for one month (30 days)"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Money
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
