"use client";

import React, {
  useCallback,
  useState,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Background,
  Controls,
  Panel,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ServiceNode, ServiceNodeData } from "@/components/diagram/ServiceNode";
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

const nodeTypes = { service: ServiceNode };

const initialNodes: Node<ServiceNodeData>[] = [
  {
    id: "1",
    type: "service",
    position: { x: 50, y: 100 },
    data: {
      label: "Order Service",
      definition: "Initiates order lifecycle and calculates totals.",
      inputSchema: "{ productId: string, quantity: number }",
      outputSchema: "{ orderId: string, amount: number }",
    },
  },
  {
    id: "2",
    type: "service",
    position: { x: 450, y: 50 },
    data: {
      label: "Stripe Gateway",
      definition: "Handles secure credit card processing.",
      inputSchema: "{ orderId: string, amount: number, currency: string }",
      outputSchema: "{ transactionId: string, success: boolean }",
    },
  },
  {
    id: "3",
    type: "service",
    position: { x: 450, y: 300 },
    data: {
      label: "Notification Service",
      definition: "Sends transactional emails and SMS alerts.",
      inputSchema: "{ userId: string, template: string, data: object }",
      outputSchema: "{ messageId: string, sentAt: string }",
    },
  },
];

// Helper to prevent hydration mismatch without triggering cascading renders
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function DiagramPage() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<ServiceNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const isMounted = useIsMounted();

  // Edit State
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ServiceNodeData>>(
    {},
  );

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
      nds.map((node) => {
        if (node.id === editingNodeId) {
          return {
            ...node,
            data: { ...node.data, ...editFormData } as ServiceNodeData,
          };
        }
        return node;
      }),
    );
    setEditingNodeId(null);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // If not mounted, return an empty div with the same dimensions to avoid layout shift
  if (!isMounted) return <div className="h-screen w-screen bg-background" />;

  return (
    <div className="h-screen w-screen bg-background overflow-hidden">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <Panel
          position="top-left"
          className="bg-card p-4 rounded-lg border shadow-lg m-4"
        >
          <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Service Registry
          </h1>
          <p className="text-xs text-foreground/60">
            Connect outputs to inputs to map your data flow.
          </p>
        </Panel>
      </ReactFlow>

      <Dialog
        open={!!editingNodeId}
        onOpenChange={(open) => !open && setEditingNodeId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Service Node</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={editFormData.label || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="def">Definition</Label>
              <Textarea
                id="def"
                placeholder="What does this service do?"
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
              <Label htmlFor="input">Input Schema</Label>
              <Textarea
                id="input"
                className="font-mono text-[11px]"
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
              <Label htmlFor="output">Output Schema</Label>
              <Textarea
                id="output"
                className="font-mono text-[11px]"
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
            <Button variant="outline" onClick={() => setEditingNodeId(null)}>
              Cancel
            </Button>
            <Button onClick={saveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
