import { cn } from "./ui/utils";

type FilterChipOption = {
  value: string;
  label: string;
};

type FilterChipGroupProps = {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FilterChipGroup({ options, value, onChange, className }: FilterChipGroupProps) {
  return (
    <div className={cn("filter-chip-scroll", className)}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn("filter-chip", isActive && "filter-chip-active")}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
