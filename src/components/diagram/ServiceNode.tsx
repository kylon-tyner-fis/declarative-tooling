import {
  Handle,
  Position,
  NodeProps,
  Node,
  useHandleConnections,
} from "@xyflow/react";
import { Settings2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ServiceNodeData = {
  label: string;
  definition: string;
  inputSchema: string;
  outputSchema: string;
  onEdit?: (id: string) => void;
};

export function ServiceNode({ id, data }: NodeProps<Node<ServiceNodeData>>) {
  const connectionsIn = useHandleConnections({ type: "target" });
  const connectionsOut = useHandleConnections({ type: "source" });

  const isTargetConnected = connectionsIn.length > 0;
  const isSourceConnected = connectionsOut.length > 0;

  // Updated base styles to include cursor-grab and active:cursor-grabbing
  const baseHandleStyle =
    "size-4! border-2 border-primary transition-all hover:scale-110 cursor-grab active:cursor-grabbing";

  return (
    <div className="px-4 py-3 shadow-lg rounded-xl bg-card border-2 border-border min-w-62.5 group transition-all hover:border-primary/50">
      <Handle
        type="target"
        position={Position.Left}
        className={baseHandleStyle}
        style={{
          backgroundColor: isTargetConnected ? "var(--primary)" : "transparent",
          borderColor: "var(--primary)",
        }}
      />

      <div className="flex items-center justify-between gap-2 mb-2 border-b pb-2">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-muted-foreground" />
          <span className="font-bold text-sm">{data.label}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => data.onEdit?.(id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
        >
          <Edit2 className="size-3" />
        </Button>
      </div>

      <div className="space-y-3 text-[10px]">
        <div>
          <p className="text-muted-foreground uppercase font-bold text-[8px] tracking-wider">
            Input Schema
          </p>
          <pre className="bg-muted p-1.5 rounded border mt-1 font-mono overflow-hidden text-ellipsis">
            {data.inputSchema || "{}"}
          </pre>
        </div>

        <div>
          <p className="text-muted-foreground uppercase font-bold text-[8px] tracking-wider">
            Definition
          </p>
          <p className="text-foreground/80 leading-relaxed line-clamp-2">
            {data.definition || "No definition provided."}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground uppercase font-bold text-[8px] tracking-wider">
            Output Schema
          </p>
          <pre className="bg-muted p-1.5 rounded border mt-1 font-mono overflow-hidden text-ellipsis">
            {data.outputSchema || "{}"}
          </pre>
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
