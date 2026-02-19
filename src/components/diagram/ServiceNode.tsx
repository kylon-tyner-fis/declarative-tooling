"use client";

import {
  Handle,
  Position,
  NodeProps,
  Node,
  useHandleConnections,
} from "@xyflow/react";
import { Eye, Database, LayoutPanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceNodeData } from "@/types/services";
import SchemaVisualizer from "./SchemaVisualizer";
import { NodeHeader } from "./NodeHeader";

export function ServiceNode({ id, data }: NodeProps<Node<ServiceNodeData>>) {
  const connectionsIn = useHandleConnections({ type: "target" });
  const connectionsOut = useHandleConnections({ type: "source" });

  const isTargetConnected = connectionsIn.length > 0;
  const isSourceConnected = connectionsOut.length > 0;

  const baseHandleStyle =
    "size-4! border-2 border-primary transition-all hover:scale-110 cursor-grab active:cursor-grabbing shadow-sm";

  return (
    <div className="px-5 py-4 shadow-2xl rounded-2xl bg-card border-2 border-border w-[320px] group transition-all hover:border-primary/50 flex flex-col gap-5">
      <Handle
        type="target"
        position={Position.Left}
        className={baseHandleStyle}
        style={{
          backgroundColor: isTargetConnected ? "var(--primary)" : "transparent",
          borderColor: "var(--primary)",
        }}
      />

      <NodeHeader
        label={data.label}
        onEdit={() => data.onEdit?.(id)}
        onPlay={() => data.onPlay?.(id)}
      />

      <div className="space-y-6">
        <div className="relative pl-3 border-l-2 border-primary/30">
          <p className="text-muted-foreground uppercase font-black text-[7px] tracking-[0.2em] mb-1.5 opacity-60">
            Definition
          </p>
          <p className="text-foreground/90 text-[10px] leading-relaxed wrap-break-word font-medium">
            {data.definition || "No description provided."}
          </p>
        </div>

        <div className="space-y-5">
          {/* Section: Dynamic Input (Includes Injected and Inherited) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-muted-foreground uppercase font-black text-[7px] tracking-[0.2em] opacity-60">
                Input Configuration
              </p>
              <Button
                variant="ghost"
                className="h-5 px-1.5 text-[8px] font-bold gap-1 text-primary hover:bg-primary/5 rounded-md transition-all"
                onClick={() =>
                  data.onViewSchema?.(data.label, "Input", data.inputSchema)
                }
              >
                <Eye className="size-2.5" /> Full Schema
              </Button>
            </div>
            <SchemaVisualizer jsonString={data.inputSchema} />
          </div>

          {/* Section: Display Artifacts (Local UI only) */}
          {data.displaySchema && data.displaySchema !== "{}" && (
            <div className="space-y-2 p-2 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between px-1">
                <p className="text-blue-600 uppercase font-black text-[7px] tracking-[0.2em] flex items-center gap-1">
                  <LayoutPanelTop className="size-2.5" /> Display Artifacts
                </p>
                <Button
                  variant="ghost"
                  className="h-5 px-1.5 text-[8px] font-bold text-blue-600 hover:bg-blue-500/10"
                  onClick={() =>
                    data.onViewSchema?.(
                      data.label,
                      "Display",
                      data.displaySchema,
                    )
                  }
                >
                  <Eye className="size-2.5" /> View
                </Button>
              </div>
              <SchemaVisualizer jsonString={data.displaySchema} />
            </div>
          )}

          {/* Section: Output Data */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-muted-foreground uppercase font-black text-[7px] tracking-[0.2em] opacity-60">
                Output Properties
              </p>
              <Button
                variant="ghost"
                className="h-5 px-1.5 text-[8px] font-bold gap-1 text-primary hover:bg-primary/5 rounded-md transition-all"
                onClick={() =>
                  data.onViewSchema?.(data.label, "Output", data.outputSchema)
                }
              >
                <Eye className="size-2.5" /> Full Schema
              </Button>
            </div>
            <SchemaVisualizer jsonString={data.outputSchema} />
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={baseHandleStyle}
        style={{
          backgroundColor: isSourceConnected ? "var(--primary)" : "transparent",
          borderColor: "var(--primary)",
        }}
      />
    </div>
  );
}
