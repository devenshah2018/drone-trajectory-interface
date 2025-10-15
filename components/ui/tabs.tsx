"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("w-full", className)} {...props} />
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1",
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    isActive?: boolean;
  }
>(({ className, value, isActive, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      isActive
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string;
    isActive?: boolean;
  }
>(({ className, value, isActive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      !isActive && "hidden",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
