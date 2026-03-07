import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Expense } from "../App";

type AddExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddExpense: (expense: Omit<Expense, "id" | "date">) => void;
  currentBalance: number;
  customCategories: string[];
  onManageCategories: () => void;
};

const DEFAULT_CATEGORIES = ["leisure", "bills", "transportation", "food", "other"];



export function AddExpenseDialog({ 
  open, 
  onOpenChange, 
  onAddExpense, 
  currentBalance,
  customCategories,
  onManageCategories 
}: AddExpenseDialogProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("food");
  const [description, setDescription] = useState("");
  
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

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

    onAddExpense({
      amount: amountNum,
      category,
      description,
    });

    setAmount("");
    setCategory("food");
    setDescription("");
    toast.success("Expense added successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Record a new expense and deduct it from your balance
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount (₱)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Category</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onManageCategories();
                }}
                className="h-auto p-1 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Manage
              </Button>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <span className="capitalize">{cat}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="What did you spend on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
