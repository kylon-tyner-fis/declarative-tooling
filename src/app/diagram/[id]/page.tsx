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
  ReactFlowInstance,
  OnConnectStartParams,
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
import {
  ChevronLeft,
  Save,
  Plus,
  Sparkles,
  Loader2,
  Eye,
  SkipForward,
} from "lucide-react";
import { ServiceNodeData } from "@/types/services";

const nodeTypes = { service: ServiceNode };

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

  // React Flow Instance (needed for coordinate conversion)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ServiceNodeData>>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(`drawing-${serviceId}`);
        if (saved) return JSON.parse(saved).nodes || [];
      }
      return [];
    },
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`drawing-${serviceId}`);
      if (saved) return JSON.parse(saved).edges || [];
    }
    return [];
  });

  // State for AI and Editor
  const [isGenerating, setIsGenerating] = useState(false);
  const [intention, setIntention] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // NEW: Track if the node being edited is "fresh" (newly created)
  const [isNewNode, setIsNewNode] = useState(false);
  // NEW: Track if AI generation has occurred for the fresh node
  const [hasGenerated, setHasGenerated] = useState(false);

  // Connection State for Drag-to-Create
  const [connectionStartParams, setConnectionStartParams] =
    useState<OnConnectStartParams | null>(null);

  const [editFormData, setEditFormData] = useState<Partial<ServiceNodeData>>(
    {},
  );

  const [viewingSchema, setViewingSchema] = useState<{
    title: string;
    type: string;
    content: string;
  } | null>(null);

  const handleSave = useCallback(() => {
    const drawingData = { nodes, edges };
    localStorage.setItem(`drawing-${serviceId}`, JSON.stringify(drawingData));
  }, [nodes, edges, serviceId]);

  // Open existing node
  const onEditNode = useCallback(
    (id: string) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === id);
        if (node) {
          setEditingNodeId(id);
          setIsNewNode(false); // Existing node, show everything
          setHasGenerated(true);
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
      setHasGenerated(true); // Reveal the rest of the form
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

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

  // 1. Modified "Add Node" to just open the dialog in "New" mode
  const addNewNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNodeId = crypto.randomUUID();
      const defaultPos = position || {
        x: Math.random() * 400,
        y: Math.random() * 400,
      };

      const newNode: Node<ServiceNodeData> = {
        id: newNodeId,
        type: "service",
        position: defaultPos,
        data: {
          label: "New Service",
          definition: "", // Start empty
          inputSchema: "{}",
          outputSchema: "{}",
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setEditingNodeId(newNodeId);
      setEditFormData(newNode.data);
      setIsNewNode(true);
      setHasGenerated(false); // Hide fields until AI runs
      return newNodeId;
    },
    [setNodes],
  );

  // 2. Capture when a connection drag starts
  const onConnectStart = useCallback((_: any, params: OnConnectStartParams) => {
    setConnectionStartParams(params);
  }, []);

  // 3. Handle dropping a connection on empty space
  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectionStartParams || !rfInstance) return;

      const target = event.target as Element;
      // Check if dropped on the pane (not on another node/handle)
      const isPane = target.classList.contains("react-flow__pane");

      if (isPane) {
        // Calculate the position where the user dropped the line
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const position = rfInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        // Create the new node at that position
        const newNodeId = addNewNode(position);

        // Auto-connect source -> new node
        const newEdge: Edge = {
          id: `e-${connectionStartParams.nodeId}-${newNodeId}`,
          source: connectionStartParams.nodeId,
          target: newNodeId,
          sourceHandle: connectionStartParams.handleId,
        };

        setEdges((eds) => addEdge(newEdge, eds));
      }

      setConnectionStartParams(null);
    },
    [connectionStartParams, rfInstance, addNewNode, setEdges],
  );

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
            Service Editor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => addNewNode()}>
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
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onInit={setRfInstance} // Capture instance on init
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      <Dialog
        open={!!editingNodeId}
        onOpenChange={(open) => !open && setEditingNodeId(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <Sparkles className="size-4 text-purple-500 fill-purple-500" />
              {isNewNode && !hasGenerated
                ? "New Service Intent"
                : "Configure Service"}
            </DialogTitle>
          </DialogHeader>

          {/* AI Input - Always visible if new */}
          <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 space-y-3 mb-2 shadow-inner">
            <Label className="text-[10px] uppercase font-black text-purple-600 tracking-widest">
              AI Magic Fill
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. A service that processes image uploads to S3"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                className="text-xs bg-background border-purple-200"
                autoFocus={isNewNode && !hasGenerated}
              />
              <Button
                size="sm"
                onClick={handleAiGenerate}
                disabled={isGenerating || !intention}
                className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
            {isNewNode && !hasGenerated && (
              <div className="flex justify-center pt-1">
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-[10px] text-muted-foreground"
                  onClick={() => setHasGenerated(true)}
                >
                  <SkipForward className="size-3 mr-1" /> Skip to manual entry
                </Button>
              </div>
            )}
          </div>

          {/* Fields - Hidden until generated or skipped if it's a new node */}
          {(!isNewNode || hasGenerated) && (
            <div className="grid gap-4 py-2 max-h-[50vh] overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
          )}

          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="ghost" onClick={() => setEditingNodeId(null)}>
              Cancel
            </Button>
            {/* Disable Save until generated or manual entry is allowed */}
            <Button onClick={saveChanges} disabled={isNewNode && !hasGenerated}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schema Viewer Dialog */}
      <Dialog
        open={!!viewingSchema}
        onOpenChange={(open) => !open && setViewingSchema(null)}
      >
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col">
          {/* ... existing schema viewer code ... */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate">
              <Eye className="size-5 text-primary shrink-0" />
              <span className="truncate">
                {viewingSchema?.title} — {viewingSchema?.type} Schema
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex-1 overflow-y-auto min-h-0 rounded-lg border bg-muted/50">
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
