import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface AsyncButtonProps extends Omit<ButtonProps, "children"> {
  isPending: boolean;
  pendingLabel: string;
  icon?: React.ReactElement;
  children: React.ReactNode;
}

export function AsyncButton({
  isPending,
  pendingLabel,
  icon,
  children,
  disabled,
  ...props
}: AsyncButtonProps): React.ReactElement {
  return (
    <Button disabled={disabled || isPending} {...props}>
      {isPending ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          {children}
          {icon}
        </>
      )}
    </Button>
  );
}
