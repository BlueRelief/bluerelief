"use client"

import { Lordicon } from "@/components/lordicon";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 64, 
  text,
  className = "" 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="text-primary/60">
        <Lordicon
          src="https://cdn.lordicon.com/uiygaziu.json"
          trigger="loop"
          size={size}
          colorize="currentColor"
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

