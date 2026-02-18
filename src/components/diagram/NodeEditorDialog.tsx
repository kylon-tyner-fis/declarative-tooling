"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, SkipForward } from "lucide-react";
import { ServiceNodeData } from "@/types/services";
import { formatJson } from "@/lib/utils";

interface NodeEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<ServiceNodeData>;
  isNewNode: boolean;
  onSave: (data: Partial<ServiceNodeData>) => void;
  contextSchema?: string;
}

export function NodeEditorDialog({
  isOpen,
  onClose,
  initialData,
  isNewNode,
  onSave,
  contextSchema,
}: NodeEditorDialogProps) {
  const [intention, setIntention] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [formData, setFormData] = useState<Partial<ServiceNodeData>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        inputSchema: formatJson(initialData.inputSchema || ""),
        outputSchema: formatJson(initialData.outputSchema || ""),
      });
      setHasGenerated(!isNewNode); // If editing existing, show fields immediately
      setIntention("");
    }
  }, [isOpen, initialData, isNewNode]);

  const handleAiGenerate = async () => {
    if (!intention) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-service", {
        method: "POST",
        body: JSON.stringify({ intention, contextSchema }),
      });
      const data = await response.json();
      setFormData({
        ...formData,
        label: data.label,
        definition: data.definition,
        inputSchema: formatJson(data.inputSchema),
        outputSchema: formatJson(data.outputSchema),
      });
      setIntention("");
      setHasGenerated(true);
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold">
            <Sparkles className="size-4 text-purple-500 fill-purple-500" />
            {isNewNode && !hasGenerated
              ? "Define Agent Intent"
              : "Configure Agent"}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 space-y-3 mb-2 shadow-inner">
          <Label className="text-[10px] uppercase font-black text-purple-600 tracking-widest">
            AI Magic Fill
          </Label>

          {contextSchema && contextSchema !== "{}" && (
            <div className="text-[10px] text-muted-foreground bg-background/50 px-2 py-1 rounded border border-dashed border-purple-200 flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
              Using context from previous node
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="e.g. Read the topic and generate a coding challenge"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="text-xs bg-background border-purple-200"
              autoFocus={isNewNode && !hasGenerated}
            />
            <Button
              size="sm"
              onClick={handleAiGenerate}
              disabled={isGenerating || !intention}
              className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Generate"
              )}
            </Button>
          </div>
          {isNewNode && !hasGenerated && (
            <div className="flex justify-center pt-1">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-[10px] text-muted-foreground"
                onClick={() => setHasGenerated(true)}
              >
                <SkipForward className="size-3 mr-1" /> Skip to manual entry
              </Button>
            </div>
          )}
        </div>

        {(!isNewNode || hasGenerated) && (
          <div className="grid gap-4 py-2 max-h-[50vh] overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Agent Name
              </Label>
              <Input
                id="name"
                value={formData.label || ""}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="def" className="text-xs font-semibold">
                Definition / System Prompt
              </Label>
              <Textarea
                id="def"
                className="text-xs min-h-15"
                value={formData.definition || ""}
                onChange={(e) =>
                  setFormData({ ...formData, definition: e.target.value })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="input" className="text-xs font-semibold">
                Input Context (JSON Schema)
              </Label>
              <Textarea
                id="input"
                className="font-mono text-[10px] min-h-25 whitespace-pre"
                value={formData.inputSchema || ""}
                onChange={(e) =>
                  setFormData({ ...formData, inputSchema: e.target.value })
                }
                spellCheck={false}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="output" className="text-xs font-semibold">
                Output Artifacts (JSON Schema)
              </Label>
              <Textarea
                id="output"
                className="font-mono text-[10px] min-h-25 whitespace-pre"
                value={formData.outputSchema || ""}
                onChange={(e) =>
                  setFormData({ ...formData, outputSchema: e.target.value })
                }
                spellCheck={false}
              />
            </div>
          </div>
        )}
        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(formData)}
            disabled={isNewNode && !hasGenerated}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
