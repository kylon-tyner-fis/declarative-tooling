"use client";

import {
  Handle,
  Position,
  NodeProps,
  Node,
  useHandleConnections,
} from "@xyflow/react";
import { Database, Edit2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceNodeData } from "@/types/services";
import SchemaVisualizer from "./SchemaVisualizer";
import { cn } from "@/lib/utils";

export function DataNode({ id, data }: NodeProps<Node<ServiceNodeData>>) {
  const connectionsIn = useHandleConnections({ type: "target" });
  const connectionsOut = useHandleConnections({ type: "source" });

  const isTargetConnected = connectionsIn.length > 0;
  const isSourceConnected = connectionsOut.length > 0;

  // Use orange-500 for the handles to match injected properties
  const baseHandleStyle =
    "size-3! border-2 border-orange-500 transition-all hover:scale-125 cursor-grab active:cursor-grabbing shadow-sm";

  return (
    <div
      className={cn(
        "px-4 py-3 shadow-xl rounded-xl border-2 transition-all flex flex-col gap-3 backdrop-blur-sm w-55 group hover:border-orange-400",
        "bg-orange-50/80 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800", // Updated to orange theme
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={baseHandleStyle}
        style={{
          backgroundColor: isTargetConnected
            ? "var(--color-orange-500)"
            : "transparent",
          borderColor: "var(--color-orange-500)",
        }}
      />

      {/* Header Styled with consistent Orange colors */}
      <div className="flex items-center justify-between gap-2 border-b border-orange-200/50 pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 border border-orange-200 shadow-sm">
            <Database className="size-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-xs truncate leading-tight text-orange-900 dark:text-orange-100">
              {data.label}
            </span>
            <span className="text-[6px] text-orange-700/70 font-black uppercase tracking-widest">
              Data Injector
            </span>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              data.onEdit?.(id);
            }}
            className="h-6 w-6 shrink-0 rounded-full hover:bg-orange-200/50 text-orange-700"
          >
            <Edit2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Body Section */}
      <div className="space-y-3">
        <p className="text-orange-800/80 dark:text-orange-200/80 text-[9px] leading-relaxed line-clamp-2 font-medium">
          {data.definition || "No description provided."}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-orange-700/60 uppercase font-black text-[6px] tracking-[0.2em]">
              Payload Schema
            </p>
            <Button
              variant="ghost"
              className="h-4 px-1 text-[7px] font-bold gap-1 text-orange-700 hover:bg-orange-200/30 rounded transition-all"
              onClick={() =>
                data.onViewSchema?.(
                  data.label,
                  "Data Payload",
                  data.outputSchema,
                )
              }
            >
              <Eye className="size-2" /> View
            </Button>
          </div>
          {/* SchemaVisualizer will automatically highlight fields if they are tagged */}
          <SchemaVisualizer jsonString={data.outputSchema} />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={baseHandleStyle}
        style={{
          backgroundColor: isSourceConnected
            ? "var(--color-orange-500)"
            : "transparent",
          borderColor: "var(--color-orange-500)",
        }}
      />
    </div>
  );
}
