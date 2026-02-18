"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Save, Database } from "lucide-react";

interface DiagramToolbarProps {
  onBack: () => void;
  onAddAgent: () => void;
  onAddData: () => void;
  onSave: () => void;
}

export function DiagramToolbar({
  onBack,
  onAddAgent,
  onAddData,
  onSave,
}: DiagramToolbarProps) {
  return (
    <div className="h-14 border-b bg-card flex items-center justify-between px-4 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="size-4 mr-1" /> Back
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="font-semibold text-sm truncate max-w-50">
          Workflow Designer
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onAddData}
          className="text-amber-700 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <Database className="size-4 mr-2" /> Add Data
        </Button>
        <Button size="sm" variant="outline" onClick={onAddAgent}>
          <Plus className="size-4 mr-2" /> Add Agent
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="size-4 mr-2" /> Save Workflow
        </Button>
      </div>
    </div>
  );
}
