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
import { ChevronLeft, Save, Plus } from "lucide-react";
import { ServiceNodeData } from "@/types/services";

const nodeTypes = { service: ServiceNode };

// Hydration-safe helper to detect client-side mounting
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

  // Edit Modal State
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ServiceNodeData>>(
    {},
  );

  // 1. Initial Load - Removed setMounted(true)
  useEffect(() => {
    const savedDrawing = localStorage.getItem(`drawing-${serviceId}`);
    if (savedDrawing) {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedDrawing);
      setNodes(savedNodes);
      setEdges(savedEdges);
    }
  }, [serviceId, setNodes, setEdges]);

  // 2. Auto-save helper
  const handleSave = useCallback(() => {
    const drawingData = { nodes, edges };
    localStorage.setItem(`drawing-${serviceId}`, JSON.stringify(drawingData));
  }, [nodes, edges, serviceId]);

  const onEditNode = useCallback(
    (id: string) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === id);
        if (node) {
          setEditingNodeId(id);
          setEditFormData(node.data);
        }
        return nds;
      });
    },
    [setNodes],
  );

  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: { ...node.data, onEdit: onEditNode },
      })),
    [nodes, onEditNode],
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
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: "New Service",
        definition: "Define purpose...",
        inputSchema: "{}",
        outputSchema: "{}",
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Return a placeholder of identical dimensions during hydration
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
          <h2 className="font-semibold text-sm">Editor</h2>
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

      <Dialog
        open={!!editingNodeId}
        onOpenChange={(open) => !open && setEditingNodeId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Node</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={editFormData.label || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Definition</Label>
              <Textarea
                value={editFormData.definition || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    definition: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Input Schema</Label>
              <Textarea
                className="font-mono text-xs"
                value={editFormData.inputSchema || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    inputSchema: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Output Schema</Label>
              <Textarea
                className="font-mono text-xs"
                value={editFormData.outputSchema || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    outputSchema: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveChanges}>Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
