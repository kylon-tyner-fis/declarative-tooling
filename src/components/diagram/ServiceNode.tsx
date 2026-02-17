import {
  Handle,
  Position,
  NodeProps,
  Node,
  useHandleConnections,
} from "@xyflow/react";
import { Settings2, Edit2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceNodeData } from "@/types/services";

/**
 * Enhanced Visualizer with deep type detection for arrays and objects.
 */
function SchemaVisualizer({ jsonString }: { jsonString: string }) {
  if (!jsonString)
    return (
      <div className="text-[9px] text-muted-foreground/60 italic px-1 py-2 bg-muted/20 rounded border border-dashed text-center">
        No schema defined
      </div>
    );

  let fields: { name: string; type: string }[] = [];
  let isInvalid = false;

  try {
    const obj = JSON.parse(jsonString);
    const properties = obj.properties || obj;

    fields = Object.entries(properties)
      .slice(0, 4)
      .map(([key, val]: [string, any]) => {
        let typeLabel = val.type || typeof val;

        // Handle array subtypes (e.g., arr[str])
        if (typeLabel === "array") {
          const itemType = val.items?.type
            ? val.items.type.substring(0, 3)
            : "any";
          typeLabel = `arr[${itemType}]`;
        } else {
          typeLabel = typeLabel.substring(0, 3);
        }

        return {
          name: key,
          type: typeLabel,
        };
      });
  } catch (e) {
    isInvalid = true;
  }

  if (isInvalid) {
    return (
      <div className="text-[8px] text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20 font-medium">
        ⚠️ Invalid Schema
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("str"))
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (t.includes("num") || t.includes("int"))
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (t.includes("boo"))
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (t.includes("arr"))
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
    if (t.includes("obj"))
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border/50 bg-muted/30 mt-2 shadow-inner">
      {fields.map((field, i) => (
        <div
          key={field.name}
          className={`flex items-center justify-between gap-3 px-2.5 py-1.5 transition-colors hover:bg-muted/60 ${
            i !== fields.length - 1 ? "border-b border-border/40" : ""
          }`}
        >
          <span className="text-[9px] font-mono font-bold text-foreground/80 truncate max-w-[110px]">
            {field.name}
          </span>
          <span
            className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-[4px] border leading-none shrink-0 tabular-nums tracking-tighter shadow-sm ${getTypeColor(field.type)}`}
          >
            {field.type}
          </span>
        </div>
      ))}
      {fields.length === 0 && (
        <div className="text-[8px] text-muted-foreground italic p-2 text-center">
          Empty Object
        </div>
      )}
    </div>
  );
}

export function ServiceNode({ id, data }: NodeProps<Node<ServiceNodeData>>) {
  const connectionsIn = useHandleConnections({ type: "target" });
  const connectionsOut = useHandleConnections({ type: "source" });

  const isTargetConnected = connectionsIn.length > 0;
  const isSourceConnected = connectionsOut.length > 0;

  const baseHandleStyle =
    "size-4! border-2 border-primary transition-all hover:scale-110 cursor-grab active:cursor-grabbing shadow-sm";

  return (
    <div className="px-5 py-4 shadow-2xl rounded-2xl bg-card border-2 border-border w-full max-w-xs group transition-all hover:border-primary/50 flex flex-col gap-5">
      <Handle
        type="target"
        position={Position.Left}
        className={baseHandleStyle}
        style={{
          backgroundColor: isTargetConnected ? "var(--primary)" : "transparent",
          borderColor: "var(--primary)",
        }}
      />

      <div className="flex items-center justify-between gap-3 border-b border-dashed pb-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <Settings2 className="size-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm truncate leading-tight mb-0.5 tracking-tight">
              {data.label}
            </span>
            <span className="text-[7px] text-muted-foreground font-black uppercase tracking-widest opacity-70">
              Service Architecture
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => data.onEdit?.(id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0 rounded-full bg-muted/50 hover:bg-muted"
        >
          <Edit2 className="size-3" />
        </Button>
      </div>

      <div className="space-y-6">
        <div className="relative pl-3 border-l-2 border-primary/30">
          <p className="text-muted-foreground uppercase font-black text-[7px] tracking-[0.2em] mb-1.5 opacity-60">
            Definition
          </p>
          <p className="text-foreground/90 text-[10px] leading-relaxed break-words line-clamp-2 font-medium">
            {data.definition || "No description provided."}
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-muted-foreground uppercase font-black text-[7px] tracking-[0.2em] opacity-60">
                Input Properties
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
