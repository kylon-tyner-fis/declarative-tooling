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

export function DataNode({ id, data }: NodeProps<Node<ServiceNodeData>>) {
  const connectionsIn = useHandleConnections({ type: "target" });
  const connectionsOut = useHandleConnections({ type: "source" });

  const isTargetConnected = connectionsIn.length > 0;
  const isSourceConnected = connectionsOut.length > 0;

  const baseHandleStyle =
    "size-3! border-2 border-amber-500 transition-all hover:scale-125 cursor-grab active:cursor-grabbing shadow-sm";

  return (
    <div className="px-4 py-3 shadow-xl rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 w-55 group hover:border-amber-400 transition-all flex flex-col gap-3 backdrop-blur-sm">
      <Handle
        type="target"
        position={Position.Left}
        className={baseHandleStyle}
        style={{
          backgroundColor: isTargetConnected
            ? "var(--amber-500)"
            : "transparent",
          borderColor: "var(--amber-500)",
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-200/50 pb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 border border-amber-200 shadow-sm">
            <Database className="size-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-xs truncate leading-tight text-amber-900 dark:text-amber-100">
              {data.label}
            </span>
            <span className="text-[6px] text-amber-700/70 font-black uppercase tracking-widest">
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
            className="h-6 w-6 shrink-0 rounded-full hover:bg-amber-200/50 text-amber-700"
          >
            <Edit2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3">
        <p className="text-amber-800/80 dark:text-amber-200/80 text-[9px] leading-relaxed line-clamp-2 font-medium">
          {data.definition || "No description provided."}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-amber-700/60 uppercase font-black text-[6px] tracking-[0.2em]">
              Payload Schema
            </p>
            <Button
              variant="ghost"
              className="h-4 px-1 text-[7px] font-bold gap-1 text-amber-700 hover:bg-amber-200/30 rounded transition-all"
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
          <SchemaVisualizer jsonString={data.outputSchema} />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className={baseHandleStyle}
        style={{
          backgroundColor: isSourceConnected
            ? "var(--amber-500)"
            : "transparent",
          borderColor: "var(--amber-500)",
        }}
      />
    </div>
  );
}
