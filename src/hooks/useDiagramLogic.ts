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
} from "@xyflow/react";
import { ServiceNodeData } from "@/types/services";
import { formatJson } from "@/lib/utils";
import { saveDiagram } from "@/app/actions";

export function useDiagramLogic(
  serviceId: string,
  initialNodes: Node<ServiceNodeData>[],
  initialEdges: Edge[],
) {
  // --- React Flow State ---
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    Node<ServiceNodeData>,
    Edge
  > | null>(null);

  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<ServiceNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  // --- Interaction State ---
  const [connectionStartParams, setConnectionStartParams] =
    useState<OnConnectStartParams | null>(null);

  // --- Dialog States ---
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isNewNode, setIsNewNode] = useState(false);
  const [generationContext, setGenerationContext] = useState<string>("");
  const [testingNode, setTestingNode] = useState<Node<ServiceNodeData> | null>(
    null,
  );
  const [viewingSchema, setViewingSchema] = useState<{
    title: string;
    type: string;
    content: string;
  } | null>(null);

  // --- Actions ---

  const handleSave = useCallback(async () => {
    try {
      // Optimistic or simple async save
      await saveDiagram(serviceId, nodes, edges);
      alert("Workflow saved successfully!"); // Replace with toast if you have one
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save workflow.");
    }
  }, [nodes, edges, serviceId]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onConnectStart: OnConnectStart = useCallback(
    (_: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
      setConnectionStartParams(params);
    },
    [],
  );

  const addNewNode = useCallback(
    (position?: { x: number; y: number }, contextSchema?: string) => {
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
          label: "New Agent",
          definition: "",
          inputSchema: contextSchema || "{}",
          outputSchema: "{}",
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setEditingNodeId(newNodeId);
      setIsNewNode(true);
      setGenerationContext(contextSchema || "");
      return newNodeId;
    },
    [setNodes],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectionStartParams || !rfInstance) return;

      const target = event.target as Element;
      const isPane = target.classList.contains("react-flow__pane");

      if (isPane) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const position = rfInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        // Use rfInstance to get the source node safely
        const sourceNode = rfInstance.getNode(
          connectionStartParams.nodeId || "",
        );
        const contextSchema = sourceNode?.data.outputSchema;

        const newNodeId = addNewNode(position, contextSchema);

        if (connectionStartParams.nodeId && connectionStartParams.handleId) {
          const newEdge: Edge = {
            id: `e-${connectionStartParams.nodeId}-${newNodeId}`,
            source: connectionStartParams.nodeId,
            target: newNodeId,
            sourceHandle: connectionStartParams.handleId,
          };
          setEdges((eds) => addEdge(newEdge, eds));
        }
      }
      setConnectionStartParams(null);
    },
    [connectionStartParams, rfInstance, addNewNode, setEdges],
  );

  const saveNodeChanges = useCallback(
    (data: Partial<ServiceNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingNodeId
            ? { ...node, data: { ...node.data, ...data } as ServiceNodeData }
            : node,
        ),
      );
      setEditingNodeId(null);
    },
    [editingNodeId, setNodes],
  );

  // --- Node Callbacks ---

  const onEditNode = useCallback(
    (id: string) => {
      const node = rfInstance?.getNode(id);
      if (node) {
        setEditingNodeId(id);
        setIsNewNode(false);
        setGenerationContext("");
      }
    },
    [rfInstance],
  );

  const onPlayNode = useCallback(
    (id: string) => {
      const node = rfInstance?.getNode(id);
      if (node) setTestingNode(node);
    },
    [rfInstance],
  );

  const onViewSchema = useCallback(
    (title: string, type: string, content: string) => {
      setViewingSchema({ title, type, content: formatJson(content) });
    },
    [],
  );

  // Inject callbacks into nodes
  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: onEditNode,
          onViewSchema: onViewSchema,
          onPlay: onPlayNode,
        },
      })),
    [nodes, onEditNode, onViewSchema, onPlayNode],
  );

  const nodeBeingEdited = useMemo(
    () => nodes.find((n) => n.id === editingNodeId),
    [nodes, editingNodeId],
  );

  return {
    // Canvas Props
    nodes: nodesWithCallbacks,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    setRfInstance,

    // Actions
    addNewNode,
    handleSave,

    // Dialog State
    dialogs: {
      editingNodeId,
      setEditingNodeId,
      nodeBeingEdited,
      isNewNode,
      generationContext,
      saveNodeChanges,

      testingNode,
      setTestingNode,

      viewingSchema,
      setViewingSchema,
    },
  };
}
