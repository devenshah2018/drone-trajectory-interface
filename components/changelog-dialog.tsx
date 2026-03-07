"use client";

import { useState } from "react";
import { ScrollText, Bug, Pickaxe } from "lucide-react";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { changelogEntries, type ChangelogEntry } from "@/lib/changelog";
import { cn } from "@/lib/utils";

function ChangelogItemBadge({ type }: { type: "bugfix" | "enhancement" }) {
  const config = {
    bugfix: {
      icon: Bug,
      label: "Bugfix",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    enhancement: {
      icon: Pickaxe,
      label: "Enhancement",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
  };
  const { icon: Icon, label, className } = config[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium shrink-0",
        className
      )}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}

/** GitHub contribution-style grid of releases. Each cell = one release, color intensity = # of items. */
function ReleaseActivityGrid() {
  const getLevel = (items: ChangelogEntry["items"]) => {
    const n = items.length;
    if (n <= 1) return 1;
    if (n <= 3) return 2;
    if (n <= 5) return 3;
    return 4;
  };
  const levelClass = (level: number) =>
    level === 0
      ? "bg-muted"
      : level === 1
        ? "bg-emerald-200 dark:bg-emerald-900/60"
        : level === 2
          ? "bg-emerald-400 dark:bg-emerald-700/70"
          : level === 3
            ? "bg-emerald-500 dark:bg-emerald-600"
            : "bg-emerald-600 dark:bg-emerald-500";
  return (
    <div className="flex flex-col gap-1 shrink-0">
      <div className="grid grid-cols-7 gap-0.5" style={{ width: "fit-content" }}>
        {changelogEntries.map((entry) => {
          const level = getLevel(entry.items);
          return (
            <div
              key={entry.version}
              className={cn(
                "w-2.5 h-2.5 rounded-sm transition-colors",
                levelClass(level)
              )}
              title={`${entry.version} (${entry.date}) — ${entry.items.length} change${entry.items.length === 1 ? "" : "s"}`}
            />
          );
        })}
      </div>
      <span className="text-[9px] text-muted-foreground">Releases</span>
    </div>
  );
}

function VersionBlock({ entry, index }: { entry: ChangelogEntry; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.15 }}
      className="relative pl-4 pb-4 last:pb-0"
    >
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="font-semibold text-foreground text-[13px] tracking-tight">{entry.version}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{entry.date}</span>
      </div>
      <ul className="space-y-1.5">
        {entry.items.map((item, i) => (
          <li key={i} className="flex gap-2 items-start text-xs leading-relaxed">
            <ChangelogItemBadge type={item.type} />
            <span className="text-muted-foreground">{item.description}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

interface ChangelogDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChangelogDialog({ open: controlledOpen, onOpenChange }: ChangelogDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 cursor-pointer"
        >
          <ScrollText className="h-4 w-4" />
          <span className="hidden sm:inline">Changelog</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[340px] max-h-[min(70vh,420px)] overflow-y-auto p-4 shadow-xl rounded-xl bg-popover"
      >
        <div className="flex items-center justify-between gap-3 mb-4 pb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Changelog</span>
          </div>
          <ReleaseActivityGrid />
        </div>
        <div className="space-y-0">
          {changelogEntries.map((entry, index) => (
            <VersionBlock key={entry.version} entry={entry} index={index} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
