"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Loader2,
  Database,
  AlertTriangle,
  Settings2,
  Code2,
  Type,
  Eye,
} from "lucide-react";
import { ServiceNodeData } from "@/types/services";
import { formatJson } from "@/lib/utils";
import { SchemaBuilder } from "./SchemaBuilder";

// --- HELPERS ---

const getSchemaKeys = (schemaStr: string) => {
  try {
    const schema = JSON.parse(schemaStr || "{}");
    return Object.keys(schema.properties || {});
  } catch {
    return [];
  }
};

const WIDGET_OPTIONS = [
  { id: "standard-input", label: "Standard Input", icon: Type },
  { id: "code-editor", label: "Code Editor", icon: Code2 },
  { id: "markdown-viewer", label: "Markdown Viewer", icon: Eye },
];

export function NodeEditorDialog({
  isOpen,
  onClose,
  initialData,
  isNewNode,
  onSave,
  contextSchema,
  nodeType = "service",
}: any) {
  const [intention, setIntention] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [formData, setFormData] = useState<Partial<ServiceNodeData>>({});
  const [showNoInputWarning, setShowNoInputWarning] = useState(false);

  const isDataNode = nodeType === "data";
  const hasNoInputs =
    !contextSchema || contextSchema === "{}" || contextSchema.trim() === "";

  // Memoize all available property keys from both schemas to drive the Widget UI
  const allPropertyKeys = useMemo(() => {
    const inputs = getSchemaKeys(formData.inputSchema || "{}");
    const outputs = getSchemaKeys(formData.outputSchema || "{}");
    // Use a Set to ensure uniqueness across both
    return Array.from(new Set([...inputs, ...outputs]));
  }, [formData.inputSchema, formData.outputSchema]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialData,
        inputSchema: formatJson(initialData.inputSchema || "{}"),
        outputSchema: formatJson(initialData.outputSchema || "{}"),
        plugins: initialData.plugins || [],
      });
      setHasGenerated(!isNewNode);
      setIntention("");
    }
  }, [isOpen, initialData, isNewNode]);

  const updatePlugin = (targetProperty: string, pluginId: string) => {
    setFormData((prev) => {
      const currentPlugins = [...(prev.plugins || [])];
      const index = currentPlugins.findIndex(
        (p) => p.targetProperty === targetProperty,
      );

      if (index > -1) {
        currentPlugins[index] = {
          ...currentPlugins[index],
          pluginId,
          label: targetProperty,
        };
      } else {
        currentPlugins.push({
          pluginId,
          targetProperty,
          label: targetProperty,
          config: [],
        });
      }
      return { ...prev, plugins: currentPlugins };
    });
  };

  const initiateAiGenerate = () => {
    if (!intention) return;
    if (!isDataNode && hasNoInputs) {
      setShowNoInputWarning(true);
    } else {
      handleAiGenerate();
    }
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    setShowNoInputWarning(false);
    try {
      const response = await fetch("/api/ai/generate-service", {
        method: "POST",
        body: JSON.stringify({ intention, contextSchema, nodeType }),
      });
      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        label: data.label,
        definition: data.definition,
        inputSchema: isDataNode ? "{}" : formatJson(data.inputSchema),
        outputSchema: formatJson(data.outputSchema),
        plugins: data.plugins || [],
      }));
      setHasGenerated(true);
      setIntention("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              {isDataNode ? (
                <Database className="size-5 text-amber-500" />
              ) : (
                <Sparkles className="size-5 text-purple-500" />
              )}
              {hasGenerated
                ? isDataNode
                  ? "Configure Data"
                  : "Configure Agent"
                : "Describe Intent"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 rounded-xl border bg-muted/20 space-y-4 mb-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-primary">
              AI Generator
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="What should this step do?"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={initiateAiGenerate}
                disabled={isGenerating || !intention}
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>

          {hasGenerated && (
            <div className="grid gap-8 py-4">
              {/* SECTION 1: IDENTITY */}
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">Agent Name</Label>
                  <Input
                    value={formData.label || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold">
                    Objective / Definition
                  </Label>
                  <Textarea
                    className="text-xs min-h-[80px]"
                    value={formData.definition || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, definition: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* SECTION 2: DATA STRUCTURES */}
              <div className="grid gap-6">
                {!isDataNode && (
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-semibold text-orange-600 uppercase tracking-tight">
                      Required Inputs
                    </Label>
                    <SchemaBuilder
                      schemaString={formData.inputSchema || "{}"}
                      onChange={(newSchema) =>
                        setFormData((prev) => ({
                          ...prev,
                          inputSchema: newSchema,
                        }))
                      }
                    />
                  </div>
                )}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-tight">
                    Logical Output
                  </Label>
                  <SchemaBuilder
                    schemaString={formData.outputSchema || "{}"}
                    onChange={(newSchema) =>
                      setFormData((prev) => ({
                        ...prev,
                        outputSchema: newSchema,
                      }))
                    }
                  />
                </div>
              </div>

              {/* SECTION 3: WIDGET MAPPING */}
              {!isDataNode && (
                <div className="grid gap-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Settings2 className="size-4 text-purple-600" />
                    <Label className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                      Interactive Widget Mapping
                    </Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Choose how the user interacts with each piece of data.
                  </p>

                  <div className="rounded-lg border bg-muted/5 divide-y shadow-sm">
                    {allPropertyKeys.length === 0 ? (
                      <div className="p-8 text-center text-[11px] text-muted-foreground italic">
                        No properties found. Add fields to schemas above to
                        configure widgets.
                      </div>
                    ) : (
                      allPropertyKeys.map((key) => {
                        const plugin = formData.plugins?.find(
                          (p) => p.targetProperty === key,
                        );
                        const currentWidget =
                          plugin?.pluginId || "standard-input";
                        const isInput = (formData.inputSchema || "").includes(
                          `"${key}"`,
                        );

                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between p-3 transition-colors hover:bg-muted/10"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border">
                                  {key}
                                </span>
                                <span
                                  className={cn(
                                    "text-[8px] font-black uppercase px-1 rounded-sm border",
                                    isInput
                                      ? "bg-orange-50 border-orange-200 text-orange-600"
                                      : "bg-primary/5 border-primary/20 text-primary",
                                  )}
                                >
                                  {isInput ? "Input" : "Output"}
                                </span>
                              </div>
                            </div>

                            <Select
                              value={currentWidget}
                              onValueChange={(val) => updatePlugin(key, val)}
                            >
                              <SelectTrigger className="w-[200px] h-9 text-[11px] font-medium bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WIDGET_OPTIONS.map((opt) => (
                                  <SelectItem
                                    key={opt.id}
                                    value={opt.id}
                                    className="text-[11px]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <opt.icon className="size-3.5 opacity-70" />
                                      {opt.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 border-t pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onSave(formData)}
              disabled={!hasGenerated}
              className="px-8 font-bold"
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showNoInputWarning}
        onOpenChange={setShowNoInputWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>Generate without Inputs?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                This agent currently has no incoming connections from other
                nodes.
              </p>
              <p>
                Without inputs, the AI will assume this is a starting node.
                Effective agents usually depend on data schemas from previous
                steps.
              </p>
              <p>Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAiGenerate}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Continue Generation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Simple local utility for class joining
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
