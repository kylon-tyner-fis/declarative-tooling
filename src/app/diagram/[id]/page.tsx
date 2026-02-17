"use client";

import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useSyncExternalStore,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Background,
  BackgroundVariant,
  Controls,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ServiceNode } from "@/components/diagram/ServiceNode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Save, Plus, Sparkles, Loader2, Eye } from "lucide-react";
import { ServiceNodeData } from "@/types/services";

const nodeTypes = { service: ServiceNode };

/**
 * Helper to ensure JSON strings are pretty-printed with indentation.
 */
const formatJson = (jsonString: string) => {
  if (!jsonString) return "";
  try {
    const parsed =
      typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
};

/**
 * Hydration-safe helper to detect client-side mounting.
 */
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function DiagramPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  const isMounted = useIsMounted();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ServiceNodeData>>(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // State for AI and Editor
  const [isGenerating, setIsGenerating] = useState(false);
  const [intention, setIntention] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ServiceNodeData>>(
    {},
  );

  // State for Schema Viewer Modal
  const [viewingSchema, setViewingSchema] = useState<{
    title: string;
    type: string;
    content: string;
  } | null>(null);

  // 1. Initial Load: specific to this serviceId
  useEffect(() => {
    const savedDrawing = localStorage.getItem(`drawing-${serviceId}`);
    if (savedDrawing) {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedDrawing);
      setNodes(savedNodes);
      setEdges(savedEdges);
    }
  }, [serviceId, setNodes, setEdges]);

  // 2. Manual Save Function
  const handleSave = useCallback(() => {
    const drawingData = { nodes, edges };
    localStorage.setItem(`drawing-${serviceId}`, JSON.stringify(drawingData));
  }, [nodes, edges, serviceId]);

  // 3. Editor Triggers
  const onEditNode = useCallback(
    (id: string) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === id);
        if (node) {
          setEditingNodeId(id);
          setEditFormData({
            ...node.data,
            inputSchema: formatJson(node.data.inputSchema),
            outputSchema: formatJson(node.data.outputSchema),
          });
        }
        return nds;
      });
    },
    [setNodes],
  );

  const onViewSchema = useCallback(
    (title: string, type: string, content: string) => {
      setViewingSchema({ title, type, content: formatJson(content) });
    },
    [],
  );

  // 4. AI Generator
  const handleAiGenerate = async () => {
    if (!intention) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-service", {
        method: "POST",
        body: JSON.stringify({ intention }),
      });
      const data = await response.json();
      setEditFormData({
        ...editFormData,
        label: data.label,
        definition: data.definition,
        inputSchema: formatJson(data.inputSchema),
        outputSchema: formatJson(data.outputSchema),
      });
      setIntention("");
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Node Callbacks Injection
  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: onEditNode,
          onViewSchema: onViewSchema,
        },
      })),
    [nodes, onEditNode, onViewSchema],
  );

  const saveChanges = () => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === editingNodeId
          ? {
              ...node,
              data: { ...node.data, ...editFormData } as ServiceNodeData,
            }
          : node,
      ),
    );
    setEditingNodeId(null);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNewNode = () => {
    const newNode: Node<ServiceNodeData> = {
      id: crypto.randomUUID(),
      type: "service",
      position: { x: 100, y: 100 },
      data: {
        label: "New Service",
        definition: "Define purpose...",
        inputSchema: "{}",
        outputSchema: "{}",
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  if (!isMounted) return <div className="h-screen w-screen bg-background" />;

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col">
      <div className="h-14 border-b bg-card flex items-center justify-between px-4 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/services")}
          >
            <ChevronLeft className="size-4 mr-1" /> Back
          </Button>
          <div className="h-4 w-px bg-border" />
          <h2 className="font-semibold text-sm truncate max-w-[200px]">
            Editor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={addNewNode}>
            <Plus className="size-4 mr-2" /> Add Node
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="size-4 mr-2" /> Save Drawing
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Editor Modal */}
      <Dialog
        open={!!editingNodeId}
        onOpenChange={(open) => !open && setEditingNodeId(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Sparkles className="size-4 text-purple-500 fill-purple-500" />
              Configure Service Node
            </DialogTitle>
          </DialogHeader>

          <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 space-y-3 mb-2 shadow-inner">
            <Label className="text-[10px] uppercase font-black text-purple-600 tracking-widest">
              AI Magic Fill
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Describe what this node should do..."
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                className="text-xs bg-background border-purple-200"
              />
              <Button
                size="sm"
                onClick={handleAiGenerate}
                disabled={isGenerating || !intention}
                className="bg-purple-600 hover:bg-purple-700 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 py-2 max-h-[50vh] overflow-y-auto pr-2">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Service Name
              </Label>
              <Input
                id="name"
                value={editFormData.label || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="def" className="text-xs font-semibold">
                Definition
              </Label>
              <Textarea
                id="def"
                className="text-xs min-h-[60px]"
                value={editFormData.definition || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    definition: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="input" className="text-xs font-semibold">
                Input Schema (JSON)
              </Label>
              <Textarea
                id="input"
                className="font-mono text-[10px] min-h-[100px] whitespace-pre"
                value={editFormData.inputSchema || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    inputSchema: e.target.value,
                  })
                }
                spellCheck={false}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="output" className="text-xs font-semibold">
                Output Schema (JSON)
              </Label>
              <Textarea
                id="output"
                className="font-mono text-[10px] min-h-[100px] whitespace-pre"
                value={editFormData.outputSchema || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    outputSchema: e.target.value,
                  })
                }
                spellCheck={false}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="ghost" onClick={() => setEditingNodeId(null)}>
              Cancel
            </Button>
            <Button onClick={saveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Schema Viewer */}
      <Dialog
        open={!!viewingSchema}
        onOpenChange={(open) => !open && setViewingSchema(null)}
      >
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate">
              <Eye className="size-5 text-primary shrink-0" />
              <span className="truncate">
                {viewingSchema?.title} — {viewingSchema?.type} Schema
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex-1 overflow-y-auto min-h-0 rounded-lg border bg-muted/50">
            {/* Key Fixes: 
          1. whitespace-pre-wrap: Forces long JSON lines to wrap
          2. break-words: Ensures single long keys/values don't overflow
          3. p-6: Adds internal padding for readability
      */}
            <pre className="p-6 font-mono text-xs whitespace-pre-wrap break-words tabular-nums leading-relaxed">
              {viewingSchema?.content || "{}"}
            </pre>
          </div>

          <DialogFooter className="mt-4 border-t pt-4 shrink-0">
            <Button onClick={() => setViewingSchema(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
