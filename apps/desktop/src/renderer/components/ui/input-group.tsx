import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function InputGroupRoot({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-input bg-background px-3 transition-colors focus-within:border-ring",
        className
      )}
      {...props}
    />
  );
}

function InputGroupIcon({ className, ...props }: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center text-muted-foreground", className)}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">): React.ReactElement {
  return (
    <Input
      className={cn(
        "h-10 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      {...props}
    />
  );
}

export const InputGroup = Object.assign(InputGroupRoot, {
  Icon: InputGroupIcon,
  Input: InputGroupInput,
});
