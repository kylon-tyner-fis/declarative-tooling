"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Play,
  Loader2,
  Terminal,
  CheckCircle2,
  Settings,
  Database,
} from "lucide-react";
import { Node } from "@xyflow/react";
import { ServiceNodeData } from "@/types/services";
import { OutputDisplay } from "./OutputDisplay";
import { DynamicForm } from "./DynamicForm";

interface PlaygroundDialogProps {
  node: Node<ServiceNodeData> | null;
  onClose: () => void;
}

export function PlaygroundDialog({ node, onClose }: PlaygroundDialogProps) {
  const [testInputData, setTestInputData] = useState<any>({});
  // NEW: State for injected data from upstream Data Nodes
  const [testInjectedData, setTestInjectedData] = useState<any>({});
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    if (node) {
      // Initialize Defined Input Data
      try {
        const inputSchema = JSON.parse(node.data.inputSchema || "{}");
        const initialInput: any = {};
        if (inputSchema.properties) {
          Object.keys(inputSchema.properties).forEach((key) => {
            initialInput[key] = "";
          });
        }
        setTestInputData(initialInput);
      } catch (e) {
        console.error("Error parsing input schema:", e);
      }

      // NEW: Initialize Injected Data
      try {
        const injectedSchema = JSON.parse(node.data.injectedData || "{}");
        const initialInjected: any = {};
        if (injectedSchema.properties) {
          Object.keys(injectedSchema.properties).forEach((key) => {
            initialInjected[key] = "";
          });
        }
        setTestInjectedData(initialInjected);
      } catch (e) {
        console.error("Error parsing injected schema:", e);
      }

      setTestOutput(null);
    }
  }, [node]);

  const handleRunTest = async () => {
    if (!node) return;
    setIsRunningTest(true);
    setTestOutput(null);

    try {
      const outputSchema = JSON.parse(node.data.outputSchema || "{}");

      // NEW: Merge both defined input and injected data for the agent
      const mergedInput = {
        ...testInputData,
        ...testInjectedData,
      };

      const response = await fetch("/api/ai/run-node", {
        method: "POST",
        body: JSON.stringify({
          definition: node.data.definition,
          inputData: mergedInput,
          outputSchema,
        }),
      });

      const result = await response.json();
      setTestOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Error running agent logic:", error);
      setTestOutput(JSON.stringify({ error: "Execution failed" }, null, 2));
    } finally {
      setIsRunningTest(false);
    }
  };

  const hasInjectedData =
    node?.data.injectedData && node.data.injectedData !== "{}";

  return (
    <Dialog open={!!node} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] max-h-[800px] flex flex-col p-0 overflow-hidden rounded-xl border-emerald-900/10">
        <div className="px-6 py-4 border-b bg-emerald-50/50 flex items-center justify-between shrink-0">
          <DialogTitle className="flex items-center gap-2 font-bold text-emerald-800 text-lg">
            <Play className="size-5 fill-emerald-700" />
            Agent Playground: {node?.data.label}
          </DialogTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleRunTest}
              disabled={isRunningTest}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
            >
              {isRunningTest ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4 fill-white" />
              )}
              Run Agent
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 min-h-0 divide-x divide-border">
          <div className="flex flex-col h-full min-h-0 bg-muted/10">
            <div className="px-4 py-2 border-b flex items-center justify-between bg-background shrink-0">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Settings className="size-3" /> Input Configuration
              </Label>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
              {/* NEW: Section for Injected Data */}
              {hasInjectedData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Database className="size-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Injected Data (Upstream)
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30">
                    <DynamicForm
                      schema={JSON.parse(node?.data.injectedData || "{}")}
                      data={testInjectedData}
                      onChange={setTestInjectedData}
                    />
                  </div>
                </div>
              )}

              {/* Standard Defined Input Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Terminal className="size-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Defined Input Properties
                  </span>
                </div>
                <DynamicForm
                  schema={JSON.parse(node?.data.inputSchema || "{}")}
                  data={testInputData}
                  onChange={setTestInputData}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full min-h-0 bg-background">
            <div className="px-4 py-2 border-b flex items-center justify-between shrink-0">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="size-3" /> Agent Artifacts
              </Label>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {isRunningTest ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground opacity-50">
                  <Loader2 className="size-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium uppercase tracking-widest animate-pulse">
                    Running Agent Logic...
                  </span>
                </div>
              ) : testOutput ? (
                <OutputDisplay data={JSON.parse(testOutput)} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
                  <Play className="size-12 fill-muted-foreground/10" />
                  <span className="text-xs font-medium uppercase tracking-widest text-center max-w-[150px]">
                    Configure inputs and execute agent
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
