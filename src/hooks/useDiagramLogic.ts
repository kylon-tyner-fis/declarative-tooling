"use client";

import { useState, useCallback, useMemo } from "react";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
  OnConnectStartParams,
  OnConnectStart,
  OnConnect,
  OnConnectEnd,
  NodeChange,
  EdgeChange,
} from "@xyflow/react";
import { ServiceNodeData } from "@/types/services";
import { formatJson, mergeSchemas } from "@/lib/utils";
import { saveDiagram } from "@/app/actions";
import { useUndoRedo } from "./useUndoRedo";

export function useDiagramLogic(
  serviceId: string,
  initialNodes: Node<ServiceNodeData>[],
  initialEdges: Edge[],
) {
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    Node<ServiceNodeData>,
    Edge
  > | null>(null);

  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<ServiceNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  const { takeSnapshot } = useUndoRedo({
    nodes,
    edges,
    setNodes: (nds) => setNodes(nds),
    setEdges: (eds) => setEdges(eds),
  });

  const onNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange[]) => {
      const isRemoval = changes.some((c) => c.type === "remove");
      if (isRemoval) takeSnapshot();
      onNodesChange(changes);
    },
    [onNodesChange, takeSnapshot],
  );

  const onEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      const isRemoval = changes.some((c) => c.type === "remove");
      if (isRemoval) takeSnapshot();
      onEdgesChange(changes);
    },
    [onEdgesChange, takeSnapshot],
  );

  /**
   * RECURSIVE INHERITANCE LOOKUP
   * Traverse up the path:
   * 1. Data nodes -> collect as 'injected' and continue up.
   * 2. Service nodes -> collect as 'standard' and STOP.
   */
  function recursiveInheritanceLookup(
    nodeId: string,
    currentNodes: Node<ServiceNodeData>[],
    currentEdges: Edge[],
  ): Array<{ schema: string; type: "injected" | "standard" }> {
    const incomingEdges = currentEdges.filter((e) => e.target === nodeId);
    let results: Array<{ schema: string; type: "injected" | "standard" }> = [];

    incomingEdges.forEach((edge) => {
      const sourceNode = currentNodes.find((n) => n.id === edge.source);
      if (!sourceNode) return;

      if (sourceNode.type === "data") {
        results.push({
          schema: sourceNode.data.outputSchema,
          type: "injected",
        });
        const upstream = recursiveInheritanceLookup(
          sourceNode.id,
          currentNodes,
          currentEdges,
        );
        results = [...results, ...upstream];
      } else {
        results.push({
          schema: sourceNode.data.outputSchema,
          type: "standard",
        });
      }
    });

    return results;
  }

  const getInheritedInputs = useCallback(
    (
      nodeId: string,
      currentNodes: Node<ServiceNodeData>[],
      currentEdges: Edge[],
    ): string => {
      const pathData = recursiveInheritanceLookup(
        nodeId,
        currentNodes,
        currentEdges,
      );
      return pathData.length > 0 ? mergeSchemas(pathData) : "{}";
    },
    [],
  );

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isNewNode, setIsNewNode] = useState(false);
  const [testingNode, setTestingNode] = useState<Node<ServiceNodeData> | null>(
    null,
  );
  const [viewingSchema, setViewingSchema] = useState<{
    title: string;
    type: string;
    content: string;
  } | null>(null);

  const handleSave = useCallback(async () => {
    try {
      await saveDiagram(serviceId, nodes, edges);
      alert("Workflow saved successfully!");
    } catch (error) {
      console.error("Save Error:", error);
    }
  }, [nodes, edges, serviceId]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, takeSnapshot],
  );

  const addNewNode = useCallback(
    (type: "service" | "data", position?: { x: number; y: number }) => {
      takeSnapshot();
      const newNodeId = crypto.randomUUID();
      const newNode: Node<ServiceNodeData> = {
        id: newNodeId,
        type: type,
        position: position || {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
        data: {
          label: type === "data" ? "New Data" : "New Agent",
          definition: "",
          inputSchema: "{}",
          outputSchema: "{}",
          displaySchema: "{}", // NEW: Ensure displaySchema is initialized
        },
      };
      setNodes((nds) => nds.concat(newNode));
      setEditingNodeId(newNodeId);
      setIsNewNode(true);
      return newNodeId;
    },
    [setNodes, takeSnapshot],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!rfInstance) return;
      const target = event.target as Element;
      if (target.classList.contains("react-flow__pane")) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const position = rfInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });
        addNewNode("service", position);
      }
    },
    [rfInstance, addNewNode],
  );

  const saveNodeChanges = useCallback(
    (data: Partial<ServiceNodeData>) => {
      takeSnapshot();
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingNodeId
            ? { ...node, data: { ...node.data, ...data } as ServiceNodeData }
            : node,
        ),
      );
      setEditingNodeId(null);
    },
    [editingNodeId, setNodes, takeSnapshot],
  );

  const onEditNode = useCallback((id: string) => {
    setEditingNodeId(id);
    setIsNewNode(false);
  }, []);

  const onViewSchema = useCallback(
    (title: string, type: string, content: string) => {
      setViewingSchema({ title, type, content: formatJson(content) });
    },
    [],
  );

  // Compute final node data for display and logic
  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          inputSchema:
            node.type === "service"
              ? getInheritedInputs(node.id, nodes, edges)
              : node.data.inputSchema,
          onEdit: onEditNode,
          onViewSchema: onViewSchema,
          onPlay: (id: string) => {
            const fullNode = nodesWithCallbacks.find((n) => n.id === id);
            setTestingNode(fullNode || null);
          },
        },
      })),
    [nodes, edges, onEditNode, onViewSchema, getInheritedInputs],
  );

  return {
    nodes: nodesWithCallbacks,
    edges,
    onNodesChange: onNodesChangeWrapped,
    onEdgesChange: onEdgesChangeWrapped,
    onNodeDragStart,
    onConnect,
    onConnectEnd,
    setRfInstance,
    addNewNode,
    handleSave,
    dialogs: {
      editingNodeId,
      setEditingNodeId,
      nodeBeingEdited: nodes.find((n) => n.id === editingNodeId),
      isNewNode,
      saveNodeChanges,
      testingNode,
      setTestingNode,
      viewingSchema,
      setViewingSchema,
      generationContext: editingNodeId
        ? getInheritedInputs(editingNodeId, nodes, edges)
        : "",
    },
  };
}
