"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative w-10 h-5 bg-gray-300 rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "data-[state=checked]:bg-blue-600"
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block w-4 h-4 bg-white rounded-full shadow transform transition-transform",
          "data-[state=checked]:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
