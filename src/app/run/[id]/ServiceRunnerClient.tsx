"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/diagram/DynamicForm";
import { OutputDisplay } from "@/components/diagram/OutputDisplay";
import {
  Loader2,
  Play,
  CheckCircle2,
  ArrowRight,
  Database,
  Sparkles,
  Eye,
} from "lucide-react";
import { registry } from "@/lib/plugin-registry";

export function ServiceRunnerClient({ serviceName, startNode, fullFlow }: any) {
  const [currentNode, setCurrentNode] = useState(startNode);
  const [accumulatedData, setAccumulatedData] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [stepResult, setStepResult] = useState<any>(null);
  const [pluginValues, setPluginValues] = useState<Record<string, any>>({});

  const isDataStep = currentNode?.type === "data";

  // Parse current output schema to handle "displayOnly" logic
  const outputSchema = useMemo(() => {
    try {
      return JSON.parse(currentNode?.data.outputSchema || "{}");
    } catch {
      return {};
    }
  }, [currentNode]);

  useEffect(() => {
    if (
      currentNode &&
      currentNode.type === "service" &&
      !stepResult &&
      !isRunning
    ) {
      handleExecution(accumulatedData);
    }
    setPluginValues({});
  }, [currentNode]);

  const handleExecution = async (inputData: any) => {
    setIsRunning(true);
    try {
      const response = await fetch("/api/ai/run-node", {
        method: "POST",
        body: JSON.stringify({
          definition: currentNode.data.definition,
          inputData,
          outputSchema: outputSchema,
        }),
      });

      const data = await response.json();
      setStepResult(data);
    } catch (error) {
      console.error("Execution failed", error);
    } finally {
      setIsRunning(false);
    }
  };

  const proceedToNext = () => {
    const nextEdge = fullFlow.edges.find(
      (e: any) => e.source === currentNode.id,
    );
    const nextNode = fullFlow.nodes.find((n: any) => n.id === nextEdge?.target);

    const currentStepOutput = stepResult?.output || stepResult;
    const outputSchemaObj = JSON.parse(currentNode.data.outputSchema || "{}");

    // Filter out displayOnly properties
    const filteredOutput: Record<string, any> = {};
    Object.keys(currentStepOutput).forEach((key) => {
      const isDisplayOnly =
        outputSchemaObj.properties?.[key]?.displayOnly === true;
      if (!isDisplayOnly) {
        filteredOutput[key] = currentStepOutput[key];
      }
    });

    const nextInputContext = {
      ...accumulatedData,
      ...filteredOutput,
      ...pluginValues,
    };

    setAccumulatedData(nextInputContext);

    if (nextNode) {
      setStepResult(null);
      setCurrentNode(nextNode);
    } else {
      alert("Workflow Complete!");
    }
  };

  if (!currentNode)
    return (
      <div className="p-12 text-center text-muted-foreground italic">
        No starting node found.
      </div>
    );

  return (
    <Card className="shadow-2xl border-2 overflow-hidden transition-all duration-500 bg-card max-w-4xl mx-auto">
      <CardHeader className="border-b bg-muted/20 pb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              {serviceName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 font-medium">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                Step {fullFlow.nodes.indexOf(currentNode) + 1}
              </span>
              {currentNode.data.label}
            </CardDescription>
          </div>
          {isRunning && (
            <Loader2 className="size-6 animate-spin text-primary opacity-50" />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-8 space-y-10 min-h-[400px]">
        {isDataStep && !stepResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-orange-800 dark:text-orange-300 text-sm font-medium italic">
              {currentNode.data.definition ||
                "Provide the required inputs to begin."}
            </div>
            <DynamicForm
              schema={outputSchema}
              data={accumulatedData}
              onChange={setAccumulatedData}
            />
          </div>
        )}

        {isRunning && (
          <div className="py-24 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
            <div className="relative size-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary animate-pulse">
              Executing Agent Logic
            </p>
          </div>
        )}

        {stepResult && !isRunning && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            {/* Interactive Scene: Unified view of inputs, display items, and output widgets */}
            <div className="grid gap-8">
              {currentNode.data.plugins?.map((p: any) => {
                const plugin = registry.getWidgetById(p.pluginId);
                const Widget = plugin.component;

                const configObject = (p.config || []).reduce(
                  (acc: any, item: any) => {
                    acc[item.key] = item.value;
                    return acc;
                  },
                  {},
                );

                // Match against schema properties to determine intent
                const outputProp = outputSchema.properties?.[p.targetProperty];
                const isDisplayOnly = outputProp?.displayOnly;
                const isInput = !outputProp;

                return (
                  <div
                    key={p.targetProperty}
                    className="group relative space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      {isDisplayOnly ? (
                        <Eye className="size-3 text-blue-500" />
                      ) : isInput ? (
                        <Database className="size-3 text-muted-foreground" />
                      ) : (
                        <Sparkles className="size-3 text-primary" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">
                        {isDisplayOnly
                          ? "Observation"
                          : isInput
                            ? "Context"
                            : "Interaction"}
                      </span>
                    </div>

                    <div className={isInput ? "opacity-80" : ""}>
                      <Widget
                        label={p.label}
                        schema={{ type: "string", ...configObject }}
                        // Inputs use accumulatedData; outputs use current results or user input
                        value={
                          isInput
                            ? accumulatedData[p.targetProperty]
                            : pluginValues[p.targetProperty] ||
                              stepResult[p.targetProperty]
                        }
                        onChange={(val: any) => {
                          if (!isInput) {
                            setPluginValues((prev) => ({
                              ...prev,
                              [p.targetProperty]: val,
                            }));
                          }
                        }}
                        readOnly={isInput || isDisplayOnly}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/5 p-6 flex justify-end gap-4">
        {isDataStep && !stepResult && (
          <Button
            onClick={() => handleExecution(accumulatedData)}
            disabled={isRunning}
            className="bg-primary hover:scale-105 transition-all gap-2 px-10 h-11 font-bold rounded-full shadow-lg"
          >
            <Play className="size-4 fill-white" /> Initialize
          </Button>
        )}

        {stepResult && !isRunning && (
          <Button
            onClick={proceedToNext}
            className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-all gap-2 px-10 h-11 font-bold rounded-full shadow-lg"
          >
            Continue Workflow <ArrowRight className="size-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
