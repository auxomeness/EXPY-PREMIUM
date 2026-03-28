import { useState } from "react";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Manage Categories</DrawerTitle>
          <DrawerDescription>Keep expense categories clean across the app.</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-5 pb-2">
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
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No custom categories yet
              </div>
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

          <DrawerFooter className="px-0 pt-3">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
