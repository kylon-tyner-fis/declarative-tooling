"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Play, Loader2, Terminal, CheckCircle2 } from "lucide-react";
import { Node } from "@xyflow/react";
import { ServiceNodeData } from "@/types/services";
import { OutputDisplay } from "./OutputDisplay";
import { formatJson } from "@/lib/utils";

interface PlaygroundDialogProps {
  node: Node<ServiceNodeData> | null;
  onClose: () => void;
}

export function PlaygroundDialog({ node, onClose }: PlaygroundDialogProps) {
  const [testInput, setTestInput] = useState("{}");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    if (node) {
      setTestInput(formatJson(node.data.inputSchema));
      setTestOutput(null);
    }
  }, [node]);

  const handleRunTest = async () => {
    if (!node) return;
    setIsRunningTest(true);
    setTestOutput(null);

    try {
      let inputData;
      try {
        inputData = JSON.parse(testInput);
      } catch (e) {
        alert("Invalid JSON in input field");
        console.error("Invalid JSON input:", e);
        setIsRunningTest(false);
        return;
      }

      let outputSchema;
      try {
        outputSchema = JSON.parse(node.data.outputSchema);
      } catch (e) {
        console.error("Invalid JSON in node output schema:", e);
        outputSchema = {};
      }

      const response = await fetch("/api/ai/run-node", {
        method: "POST",
        body: JSON.stringify({
          definition: node.data.definition,
          inputData,
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

  return (
    <Dialog open={!!node} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-200 h-[90vh] max-h-200 flex flex-col p-0 overflow-hidden rounded-xl border-emerald-900/10">
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
          {/* Left: Input */}
          <div className="flex flex-col h-full min-h-0 bg-muted/10">
            <div className="px-4 py-2 border-b flex items-center justify-between bg-background shrink-0">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Terminal className="size-3" /> Input Context
              </Label>
              <div className="text-[10px] text-muted-foreground">JSON</div>
            </div>
            <div className="flex-1 min-h-0 relative">
              <Textarea
                className="w-full h-full font-mono text-xs bg-transparent border-0 rounded-none resize-none focus-visible:ring-0 p-4"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="{}"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Right: Output */}
          <div className="flex flex-col h-full min-h-0 bg-background">
            <div className="px-4 py-2 border-b flex items-center justify-between shrink-0">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="size-3" /> Agent Artifacts
              </Label>
              {testOutput && (
                <span className="text-[10px] text-emerald-600 font-medium px-2 py-0.5 bg-emerald-50 rounded-full">
                  Success
                </span>
              )}
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
                  <span className="text-xs font-medium uppercase tracking-widest text-center max-w-37.5">
                    Ready to execute
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
