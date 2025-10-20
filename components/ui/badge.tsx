import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    let colorClass = "";
    switch (variant) {
      case "secondary":
        colorClass = "bg-muted text-foreground";
        break;
      case "destructive":
        colorClass = "bg-destructive text-destructive-foreground";
        break;
      case "outline":
        colorClass = "border border-border bg-background text-foreground";
        break;
      default:
        colorClass = "bg-primary text-primary-foreground";
    }
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${colorClass} ${className}`}
        {...props}
      />
    );
  }
);

export { Badge };

Badge.displayName = "Badge";