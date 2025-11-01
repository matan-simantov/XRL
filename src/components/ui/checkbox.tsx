import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useButtonColor } from "@/hooks/use-button-color";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { buttonColor } = useButtonColor();
  
  const colorMap: Record<string, { border: string; bg: string }> = {
    purple: { border: "border-purple-600", bg: "data-[state=checked]:bg-purple-600" },
    blue: { border: "border-blue-600", bg: "data-[state=checked]:bg-blue-600" },
    green: { border: "border-green-600", bg: "data-[state=checked]:bg-green-600" },
    orange: { border: "border-orange-600", bg: "data-[state=checked]:bg-orange-600" },
    red: { border: "border-red-600", bg: "data-[state=checked]:bg-red-600" },
    pink: { border: "border-pink-600", bg: "data-[state=checked]:bg-pink-600" },
  };
  
  const colors = colorMap[buttonColor] || colorMap.blue;
  
  return (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border ring-offset-background data-[state=checked]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        colors.border,
        colors.bg,
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
