import { useState } from "react";
import { Input } from "./ui/input";
import { Eye, EyeOff } from "lucide-react";

type FloatingLabelInputProps = {
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  maxLength?: number;
};

export function FloatingLabelInput({
  type,
  label,
  value,
  onChange,
  className = "",
  required = false,
  maxLength,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isDate = type === "date";
  const isActive = isFocused || value.length > 0 || isDate;
  const isPassword = type === "password";

  return (
    <div className="relative">
      <Input
        type={isPassword && showPassword ? "text" : type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`h-14 pt-6 ${isPassword ? "pr-12" : ""} ${className}`}
        placeholder=""
        required={required}
        maxLength={maxLength}
      />
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none font-bold ${
          isActive
            ? "top-1.5 text-[9px] text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
        }`}
      >
        {label.toUpperCase()}
      </label>
      {isPassword && value.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
}
