"use client";

import { Settings2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NodeHeaderProps {
  label: string;
  onEdit?: () => void;
}

export function NodeHeader({ label, onEdit }: NodeHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed pb-3">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
          <Settings2 className="size-5" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-sm truncate leading-tight mb-0.5 tracking-tight">
            {label}
          </span>
          <span className="text-[7px] text-muted-foreground font-black uppercase tracking-widest opacity-70">
            Service Architecture
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0 rounded-full bg-muted/50 hover:bg-muted"
      >
        <Edit2 className="size-3" />
      </Button>
    </div>
  );
}
