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
import {
  Sparkles,
  Loader2,
  SkipForward,
  Database,
  Plus,
  X,
} from "lucide-react";
import { ServiceNodeData } from "@/types/services";
import { formatJson } from "@/lib/utils";
import { SchemaBuilder } from "./SchemaBuilder"; // Import the new component

interface NodeEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<ServiceNodeData>;
  isNewNode: boolean;
  onSave: (data: Partial<ServiceNodeData>) => void;
  contextSchema?: string;
  nodeType?: string;
}

export function NodeEditorDialog({
  isOpen,
  onClose,
  initialData,
  isNewNode,
  onSave,
  contextSchema,
  nodeType = "service",
}: NodeEditorDialogProps) {
  const [intention, setIntention] = useState("");
  // New state for additional edge inputs
  const [additionalInputs, setAdditionalInputs] = useState<string[]>([]);
  const [newInputName, setNewInputName] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [formData, setFormData] = useState<Partial<ServiceNodeData>>({});

  const isDataNode = nodeType === "data";

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        inputSchema: formatJson(initialData.inputSchema || ""),
        outputSchema: formatJson(initialData.outputSchema || ""),
      });
      setHasGenerated(!isNewNode);
      setIntention("");
      setAdditionalInputs([]);
      setNewInputName("");
    }
  }, [isOpen, initialData, isNewNode]);

  const addInput = () => {
    if (newInputName.trim()) {
      setAdditionalInputs([...additionalInputs, newInputName.trim()]);
      setNewInputName("");
    }
  };

  const removeInput = (index: number) => {
    setAdditionalInputs(additionalInputs.filter((_, i) => i !== index));
  };

  const handleAiGenerate = async () => {
    if (!intention) return;
    setIsGenerating(true);
    try {
      const requestBody = {
        intention,
        contextSchema,
        nodeType,
        additionalInputs,
      };

      const response = await fetch("/api/ai/generate-service", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        label: data.label,
        definition: data.definition,
        inputSchema: isDataNode ? "{}" : formatJson(data.inputSchema),
        outputSchema: formatJson(data.outputSchema),
      }));
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold">
            {isDataNode ? (
              <Database className="size-5 text-amber-500" />
            ) : (
              <Sparkles className="size-5 text-purple-500" />
            )}
            {isNewNode && !hasGenerated
              ? isDataNode
                ? "Define Data Structure"
                : "Define Agent Intent"
              : isDataNode
                ? "Configure Data Node"
                : "Configure Agent"}
          </DialogTitle>
        </DialogHeader>

        <div
          className={`p-4 rounded-xl border space-y-4 mb-2 shadow-inner ${isDataNode ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20" : "bg-purple-50 border-purple-200 dark:bg-purple-950/20"}`}
        >
          <Label
            className={`text-[10px] uppercase font-black tracking-widest ${isDataNode ? "text-amber-600" : "text-purple-600"}`}
          >
            AI Magic Fill
          </Label>

          {!isDataNode && contextSchema && contextSchema !== "{}" && (
            <div className="text-[10px] text-muted-foreground bg-background/50 px-2 py-1.5 rounded border border-dashed border-purple-200 flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="truncate max-w-[400px]">
                Connected to source output (Schema inherited)
              </span>
            </div>
          )}

          {/* Additional Edge Inputs */}
          {isNewNode && !hasGenerated && !isDataNode && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                Add Trigger/Edge Data
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. User Solution Code"
                  value={newInputName}
                  onChange={(e) => setNewInputName(e.target.value)}
                  className="h-8 text-xs bg-background border-purple-200"
                  onKeyDown={(e) => e.key === "Enter" && addInput()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addInput}
                  className="h-8 border-purple-200 hover:bg-purple-100"
                >
                  <Plus className="size-3" />
                </Button>
              </div>

              {additionalInputs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {additionalInputs.map((input, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 bg-white dark:bg-black border border-purple-200 px-2 py-1 rounded-md shadow-sm"
                    >
                      <span className="text-[10px] font-medium">{input}</span>
                      <button
                        onClick={() => removeInput(i)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label
              className={`text-xs font-semibold ${isDataNode ? "text-amber-900 dark:text-amber-100" : "text-purple-900 dark:text-purple-100"}`}
            >
              {isDataNode ? "Data Description" : "Agent Goal"}
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder={
                  isDataNode
                    ? "e.g. User Profile with ID, Name, and Email"
                    : "e.g. Evaluate the code against the challenge requirements"
                }
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                className="text-xs bg-background"
                autoFocus={isNewNode && !hasGenerated}
              />
              <Button
                size="sm"
                onClick={handleAiGenerate}
                disabled={isGenerating || !intention}
                className={`shrink-0 text-white ${isDataNode ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"}`}
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
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
          <div className="grid gap-4 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                {isDataNode ? "Data Label" : "Agent Name"}
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
                {isDataNode ? "Description" : "System Prompt / Definition"}
              </Label>
              <Textarea
                id="def"
                className="text-xs min-h-[60px]"
                value={formData.definition || ""}
                onChange={(e) =>
                  setFormData({ ...formData, definition: e.target.value })
                }
              />
            </div>

            {/* Input Schema - Using SchemaBuilder */}
            {!isDataNode && (
              <div className="grid gap-1.5">
                <Label htmlFor="input" className="text-xs font-semibold">
                  Input Context
                </Label>
                <SchemaBuilder
                  schemaString={formData.inputSchema || "{}"}
                  onChange={(newSchema) =>
                    setFormData((prev) => ({ ...prev, inputSchema: newSchema }))
                  }
                />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="output" className="text-xs font-semibold">
                {isDataNode ? "Data Schema" : "Output Artifacts"}
              </Label>
              <SchemaBuilder
                schemaString={formData.outputSchema || "{}"}
                onChange={(newSchema) =>
                  setFormData((prev) => ({ ...prev, outputSchema: newSchema }))
                }
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
