"use client";

import React from "react";
import { EyeOff, AlertCircle, Sparkles, Code2, Type, Eye } from "lucide-react";

interface SchemaVisualizerProps {
  jsonString: string;
  plugins?: any[]; // Added to receive the mapping from the node
}

const getTypeColor = (type: string) => {
  const t = type?.toLowerCase() || "";
  if (t.includes("string"))
    return "bg-blue-500/10 text-blue-600 border-blue-200";
  if (t.includes("number"))
    return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
  if (t.includes("boolean"))
    return "bg-purple-500/10 text-purple-600 border-purple-200";
  if (t.includes("array"))
    return "bg-orange-500/10 text-orange-600 border-orange-200";
  return "bg-slate-500/10 text-slate-600 border-slate-200";
};

// Helper to get the icon associated with the widget type
const getPluginIcon = (pluginId: string) => {
  switch (pluginId) {
    case "code-editor":
      return <Code2 className="size-2.5" />;
    case "standard-input":
      return <Type className="size-2.5" />;
    case "markdown-viewer":
      return <Eye className="size-2.5" />;
    default:
      return <Sparkles className="size-2.5" />;
  }
};

export default function SchemaVisualizer({
  jsonString,
  plugins = [],
}: SchemaVisualizerProps) {
  let fields: any[] = [];
  let parseError = false;

  try {
    const obj = JSON.parse(jsonString || "{}");
    const properties = obj.properties || (typeof obj === "object" ? obj : {});

    fields = Object.entries(properties).map(([key, val]: [string, any]) => {
      // Find which plugin is assigned to this specific property
      const correlatedPlugin = plugins.find((p) => p.targetProperty === key);

      let typeLabel = val?.type || typeof val;
      if (val?.type === "array" && val.items?.type) {
        typeLabel = `array[${val.items.type}]`;
      }
      return {
        name: key,
        type: typeLabel,
        displayOnly: val?.displayOnly === true,
        pluginId: correlatedPlugin?.pluginId,
      };
    });
  } catch (e) {
    parseError = true;
  }

  if (parseError) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-destructive/5 border border-destructive/20 text-[10px] text-destructive italic">
        <AlertCircle className="size-3" /> Invalid Schema
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-3 text-center rounded-lg border border-dashed border-muted-foreground/20 text-[9px] text-muted-foreground italic">
        No properties defined
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/50 bg-muted/30 mt-2 shadow-inner">
      {fields.map((field, i) => (
        <div
          key={field.name}
          className={`flex items-center justify-between gap-3 px-2.5 py-1.5 transition-colors hover:bg-muted/60 ${
            i !== fields.length - 1 ? "border-b border-border/40" : ""
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-[9px] font-mono font-bold text-foreground/80 truncate">
              {field.name}
            </span>

            {/* Plugin Correlation Badge */}
            {field.pluginId && (
              <div
                title={`Handled by ${field.pluginId}`}
                className="flex items-center gap-1 px-1 py-0.5 rounded bg-primary/10 border border-primary/20 text-[6px] font-black uppercase text-primary tracking-tighter"
              >
                {getPluginIcon(field.pluginId)}
                <span className="hidden sm:inline">
                  {field.pluginId
                    .replace("-input", "")
                    .replace("-viewer", "")
                    .replace("code-", "")}
                </span>
              </div>
            )}

            {field.displayOnly && (
              <span title="Display Only (Not passed downstream)">
                <EyeOff className="size-2.5 text-blue-500" />
              </span>
            )}
          </div>
          <span
            className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-lg border leading-none shrink-0 tabular-nums tracking-tighter shadow-sm ${getTypeColor(
              field.type,
            )}`}
          >
            {field.type}
          </span>
        </div>
      ))}
    </div>
  );
}
