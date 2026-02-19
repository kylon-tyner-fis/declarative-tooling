"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Settings2, Play, Zap, Layers, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import SchemaVisualizer from "./SchemaVisualizer";
import { ServiceNodeData } from "@/types/services";

export const ServiceNode = memo(
  ({ id, data, isConnectable }: NodeProps<Node<ServiceNodeData>>) => {
    return (
      <div className="group relative">
        {/* Handles - Positioned outside overflow container */}
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className="size-4! border-2 border-background bg-orange-500 -left-2! z-50 transition-transform hover:scale-125"
        />
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className="size-4! border-2 border-background bg-primary -right-2! z-50 transition-transform hover:scale-125"
        />

        {/* Background Glow */}
        <div className="absolute -inset-0.5 bg-linear-to-r from-primary/50 to-purple-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000" />

        {/* Main Card Container */}
        <div className="relative w-72 bg-card border-2 border-border rounded-2xl shadow-xl overflow-hidden transition-all duration-300 group-hover:border-primary/50">
          {/* Header Section */}
          <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Zap className="size-4 fill-primary/20" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest leading-none">
                  {data.label || "Service Agent"}
                </h3>
                <p className="text-[9px] text-muted-foreground font-medium mt-1">
                  Logic Node
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                data.onEdit?.(id);
              }}
            >
              <Settings2 className="size-3.5" />
            </Button>
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-5">
            {/* Objective / Intent */}
            {data.definition && (
              <div className="space-y-1.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 px-1">
                  Objective
                </p>
                <p className="text-[10px] leading-relaxed text-foreground/80 font-medium px-1 italic">
                  {data.definition}
                </p>
              </div>
            )}

            <div className="space-y-4 pt-2 border-t border-dashed border-border">
              {/* Required Inputs */}
              <div className="space-y-2 p-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
                <div className="flex items-center justify-between px-1">
                  <p className="text-orange-600 dark:text-orange-400 uppercase font-black text-[7px] tracking-[0.2em]">
                    Required Inputs
                  </p>
                  <Database className="size-2.5 text-orange-500/50" />
                </div>
                <SchemaVisualizer
                  jsonString={data.inputSchema}
                  plugins={data.plugins}
                />
              </div>

              {/* Outputs & Artifacts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-muted-foreground uppercase font-black text-[7px] tracking-[0.2em] opacity-60">
                    Outputs & Artifacts
                  </p>
                  <Layers className="size-2.5 text-muted-foreground opacity-40" />
                </div>
                <SchemaVisualizer
                  jsonString={data.outputSchema}
                  plugins={data.plugins}
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-3 bg-muted/10 border-t border-border flex justify-end gap-2">
            <Button
              size="sm"
              className="h-7 text-[9px] font-black uppercase tracking-widest gap-2 rounded-lg hover:scale-105 transition-transform cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                data.onPlay?.(id);
              }}
            >
              <Play className="size-2.5 fill-current" /> Run Node
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

ServiceNode.displayName = "ServiceNode";
