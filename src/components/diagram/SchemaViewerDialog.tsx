"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface SchemaViewerDialogProps {
  data: {
    title: string;
    type: string;
    content: string;
  } | null;
  onClose: () => void;
}

export function SchemaViewerDialog({ data, onClose }: SchemaViewerDialogProps) {
  return (
    <Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-150 w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <Eye className="size-5 text-primary shrink-0" />
            <span className="truncate">
              {data?.title} — {data?.type} Schema
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex-1 overflow-y-auto min-h-0 rounded-lg border bg-muted/50">
          <pre className="p-6 font-mono text-xs whitespace-pre-wrap wrap-break-word tabular-nums leading-relaxed">
            {data?.content || "{}"}
          </pre>
        </div>
        <DialogFooter className="mt-4 border-t pt-4 shrink-0">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
