import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

type ManageCategoriesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customCategories: string[];
  onUpdateCategories: (categories: string[]) => void;
};

const DEFAULT_CATEGORIES = ["leisure", "bills", "transportation", "food", "other"];

export function ManageCategoriesDialog({ 
  open, 
  onOpenChange, 
  customCategories,
  onUpdateCategories 
}: ManageCategoriesDialogProps) {
  const [newCategory, setNewCategory] = useState("");

  const handleAddCategory = () => {
    const trimmed = newCategory.trim().toLowerCase();
    
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }

    if (DEFAULT_CATEGORIES.includes(trimmed)) {
      toast.error("This category already exists as a default");
      return;
    }

    if (customCategories.includes(trimmed)) {
      toast.error("This category already exists");
      return;
    }

    onUpdateCategories([...customCategories, trimmed]);
    setNewCategory("");
    toast.success(`Category "${trimmed}" added`);
  };

  const handleRemoveCategory = (category: string) => {
    onUpdateCategories(customCategories.filter(c => c !== category));
    toast.success(`Category "${category}" removed`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add or remove custom expense categories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Default Categories</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((category) => (
                <Badge key={category} variant="secondary" className="capitalize">
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Custom Categories</Label>
            {customCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No custom categories yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customCategories.map((category) => (
                  <Badge key={category} variant="outline" className="capitalize pr-1">
                    {category}
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-category">Add New Category</Label>
            <div className="flex gap-2">
              <Input
                id="new-category"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button type="button" onClick={handleAddCategory} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
