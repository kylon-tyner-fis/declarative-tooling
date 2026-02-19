"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Play,
  Loader2,
  CheckCircle2,
  Settings,
  LayoutPanelTop,
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
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    if (node) {
      try {
        const schema = JSON.parse(node.data.inputSchema || "{}");
        const initialData: any = {};
        if (schema.properties) {
          Object.keys(schema.properties).forEach((key) => {
            initialData[key] = "";
          });
        }
        setTestInputData(initialData);
        setTestOutput(null);
      } catch (e) {
        setTestInputData({});
      }
    }
  }, [node]);

  const handleRunTest = async () => {
    if (!node) return;
    setIsRunningTest(true);
    setTestOutput(null);

    try {
      const response = await fetch("/api/ai/run-node", {
        method: "POST",
        body: JSON.stringify({
          definition: node.data.definition,
          inputData: testInputData,
          outputSchema: JSON.parse(node.data.outputSchema || "{}"),
          displaySchema: JSON.parse(node.data.displaySchema || "{}"),
        }),
      });

      const result = await response.json();
      setTestOutput(result);
    } catch (error) {
      setTestOutput({ error: "Execution failed" });
    } finally {
      setIsRunningTest(false);
    }
  };

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
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
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
          {/* Left Panel: Simulation Inputs */}
          <div className="flex flex-col h-full min-h-0 bg-muted/10">
            <div className="px-4 py-2 border-b bg-background shrink-0">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Settings className="size-3" /> Simulation Inputs
              </Label>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-background/50">
              {node && (
                <DynamicForm
                  schema={JSON.parse(node.data.inputSchema || "{}")}
                  data={testInputData}
                  onChange={setTestInputData}
                />
              )}
            </div>
          </div>

          {/* Right Panel: Categorized Outputs */}
          <div className="flex flex-col h-full min-h-0 bg-background">
            <div className="px-4 py-2 border-b shrink-0 flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="size-3" /> Agent Response
              </Label>
              {testOutput && (
                <span className="text-[10px] text-emerald-600 font-medium px-2 py-0.5 bg-emerald-50 rounded-full">
                  Success
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {isRunningTest ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground opacity-50">
                  <Loader2 className="size-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium uppercase tracking-widest animate-pulse">
                    Executing...
                  </span>
                </div>
              ) : testOutput ? (
                <div className="divide-y divide-border">
                  {/* Display Artifacts Section */}
                  <div className="p-6 space-y-4 bg-blue-50/30">
                    <div className="flex items-center gap-2 text-blue-700">
                      <LayoutPanelTop className="size-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Display Artifacts
                      </span>
                    </div>
                    {/* Access ONLY the display key */}
                    <OutputDisplay data={testOutput.display || {}} />
                  </div>

                  {/* Data Output Section */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Database className="size-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Logical Output (Downstream)
                      </span>
                    </div>
                    {/* Access ONLY the output key */}
                    <OutputDisplay data={testOutput.output || {}} />
                  </div>
                </div>
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
