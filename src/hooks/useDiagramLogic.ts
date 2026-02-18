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
import { formatJson, mergeSchemas } from "@/lib/utils"; // mergeSchemas must be in utils
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

  // --- Helper: Recursive Injected Data Builder ---
  const getInjectedDataSchema = useCallback(
    (
      nodeId: string,
      currentNodes: Node<ServiceNodeData>[],
      currentEdges: Edge[],
    ): string => {
      const incomingEdges = currentEdges.filter((e) => e.target === nodeId);
      let dataNodeSchemas: string[] = [];

      incomingEdges.forEach((edge) => {
        const sourceNode = currentNodes.find((n) => n.id === edge.source);
        if (!sourceNode) return;

        // If source is a Data Node, grab its schema
        if (sourceNode.type === "data") {
          if (
            sourceNode.data.outputSchema &&
            sourceNode.data.outputSchema !== "{}"
          ) {
            dataNodeSchemas.push(sourceNode.data.outputSchema);
          }
          // Recursively find data nodes upstream of this data node
          const upstream = getInjectedDataSchema(
            sourceNode.id,
            currentNodes,
            currentEdges,
          );
          if (upstream !== "{}") dataNodeSchemas.push(upstream);
        }
      });

      return dataNodeSchemas.length > 0 ? mergeSchemas(dataNodeSchemas) : "{}";
    },
    [],
  );

  // --- Actions ---
  const handleSave = useCallback(async () => {
    try {
      await saveDiagram(serviceId, nodes, edges);
      alert("Workflow saved successfully!");
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
    (
      type: "service" | "data",
      position?: { x: number; y: number },
      contextSchema?: string,
    ) => {
      const newNodeId = crypto.randomUUID();
      const defaultPos = position || { x: 400, y: 400 };

      const newNode: Node<ServiceNodeData> = {
        id: newNodeId,
        type,
        position: defaultPos,
        data: {
          label: type === "data" ? "New Data" : "New Agent",
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
      if (target.classList.contains("react-flow__pane")) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        const position = rfInstance.screenToFlowPosition({
          x: clientX,
          y: clientY,
        });
        const newNodeId = addNewNode("service", position);
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

  const onEditNode = useCallback((id: string) => {
    setEditingNodeId(id);
    setIsNewNode(false);
    setGenerationContext("");
  }, []);

  const onPlayNode = useCallback(
    (id: string) => {
      const node = rfInstance?.getNode(id);
      if (node) setTestingNode(node as Node<ServiceNodeData>);
    },
    [rfInstance],
  );

  const onViewSchema = useCallback(
    (title: string, type: string, content: string) => {
      setViewingSchema({ title, type, content: formatJson(content) });
    },
    [],
  );

  // Inject callbacks and dynamic injectedData
  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          injectedData:
            node.type === "service"
              ? getInjectedDataSchema(node.id, nodes, edges)
              : undefined,
          onEdit: onEditNode,
          onViewSchema: onViewSchema,
          onPlay: onPlayNode,
        },
      })),
    [nodes, edges, onEditNode, onViewSchema, onPlayNode, getInjectedDataSchema],
  );

  const nodeBeingEdited = useMemo(
    () => nodes.find((n) => n.id === editingNodeId),
    [nodes, editingNodeId],
  );

  return {
    nodes: nodesWithCallbacks,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    setRfInstance,
    addNewNode,
    handleSave,
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
