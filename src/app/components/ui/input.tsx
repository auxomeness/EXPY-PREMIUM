import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/85 selection:bg-primary selection:text-primary-foreground border-input text-foreground flex h-11 w-full min-w-0 rounded-xl border border-border/70 bg-input-background/95 px-3.5 py-2 text-base shadow-[0_8px_20px_-18px_rgba(15,23,42,0.3)] transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-border/90 dark:bg-input-background/92 dark:text-foreground dark:placeholder:text-muted-foreground/90 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
