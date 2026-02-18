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
  // --- React Flow State ---
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    Node<ServiceNodeData>,
    Edge
  > | null>(null);

  const [nodes, setNodes, onNodesChange] =
    useNodesState<Node<ServiceNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  // --- Undo/Redo Hook ---
  const { takeSnapshot } = useUndoRedo({
    nodes,
    edges,
    setNodes: (nds) => setNodes(nds),
    setEdges: (eds) => setEdges(eds),
  });

  // --- Wrapped Change Handlers ---
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

  // --- Helper: Recursive Context Builder ---
  // Using a standard function to allow hoisting for recursion
  function recursiveUpstreamLookup(
    nodeId: string,
    currentNodes: Node<ServiceNodeData>[],
    currentEdges: Edge[],
  ): string[] {
    const incomingEdges = currentEdges.filter((e) => e.target === nodeId);
    let schemas: string[] = [];

    incomingEdges.forEach((edge) => {
      const sourceNode = currentNodes.find((n) => n.id === edge.source);
      if (!sourceNode) return;

      // 1. Collect direct output
      if (
        sourceNode.data.outputSchema &&
        sourceNode.data.outputSchema !== "{}"
      ) {
        schemas.push(sourceNode.data.outputSchema);
      }

      // 2. If Data node, recurse upstream to pass context through
      if (sourceNode.type === "data") {
        const upstream = recursiveUpstreamLookup(
          sourceNode.id,
          currentNodes,
          currentEdges,
        );
        schemas = [...schemas, ...upstream];
      }
    });

    return schemas;
  }

  // Wrap the helper for use in the editor and connection handlers
  const getUpstreamContext = useCallback(
    (
      nodeId: string,
      currentNodes: Node<ServiceNodeData>[],
      currentEdges: Edge[],
    ): string => {
      const allSchemas = recursiveUpstreamLookup(
        nodeId,
        currentNodes,
        currentEdges,
      );
      return allSchemas.length > 0 ? mergeSchemas(allSchemas) : "{}";
    },
    [],
  );

  // Specialized helper for ServiceNode "Injected Data" section
  const getInjectedDataOnly = useCallback(
    (
      nodeId: string,
      currentNodes: Node<ServiceNodeData>[],
      currentEdges: Edge[],
    ): string => {
      const incomingEdges = currentEdges.filter((e) => e.target === nodeId);
      let dataSchemas: string[] = [];

      incomingEdges.forEach((edge) => {
        const sourceNode = currentNodes.find((n) => n.id === edge.source);
        if (!sourceNode) return;

        if (sourceNode.type === "data") {
          if (
            sourceNode.data.outputSchema &&
            sourceNode.data.outputSchema !== "{}"
          ) {
            dataSchemas.push(sourceNode.data.outputSchema);
          }
          // Pass through data node chain recursively
          const upstreamData = recursiveUpstreamLookup(
            sourceNode.id,
            currentNodes,
            currentEdges,
          );
          dataSchemas = [...dataSchemas, ...upstreamData];
        }
      });

      return dataSchemas.length > 0 ? mergeSchemas(dataSchemas) : "{}";
    },
    [],
  );

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
      await saveDiagram(serviceId, nodes, edges);
      alert("Workflow saved successfully!");
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save workflow.");
    }
  }, [nodes, edges, serviceId]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, takeSnapshot],
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
      takeSnapshot();
      const newNodeId = crypto.randomUUID();
      const defaultPos = position || {
        x: Math.random() * 400,
        y: Math.random() * 400,
      };

      const newNode: Node<ServiceNodeData> = {
        id: newNodeId,
        type: type,
        position: defaultPos,
        data: {
          label: type === "data" ? "New Data" : "New Agent",
          definition: "",
          // Use contextSchema to pre-populate inputs
          inputSchema: contextSchema || "{}",
          outputSchema: "{}",
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setEditingNodeId(newNodeId);
      setIsNewNode(true);
      setGenerationContext(contextSchema || "{}");
      return newNodeId;
    },
    [setNodes, takeSnapshot],
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

        // 1. Find the source node from which the drag started
        const sourceNode = rfInstance.getNode(
          connectionStartParams.nodeId || "",
        );

        // 2. Get that specific node's output schema
        // We use its output as the input for the newly created node
        const inheritedSchema = sourceNode?.data?.outputSchema || "{}";

        // 3. Create the new node passing the inherited schema as the inputSchema
        const newNodeId = addNewNode("service", position, inheritedSchema);

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

  const onEditNode = useCallback(
    (id: string) => {
      const node = rfInstance?.getNode(id);
      const currentNodes = (rfInstance?.getNodes() ||
        []) as Node<ServiceNodeData>[];
      const currentEdges = rfInstance?.getEdges() || [];

      if (node) {
        setEditingNodeId(id);
        setIsNewNode(false);
        // Refresh context when opening existing nodes
        const context = getUpstreamContext(id, currentNodes, currentEdges);
        setGenerationContext(context);
      }
    },
    [rfInstance, getUpstreamContext],
  );

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
              ? getInjectedDataOnly(node.id, nodes, edges)
              : undefined,
          onEdit: onEditNode,
          onViewSchema: onViewSchema,
          onPlay: onPlayNode,
        },
      })),
    [nodes, edges, onEditNode, onViewSchema, onPlayNode, getInjectedDataOnly],
  );

  const nodeBeingEdited = useMemo(
    () => nodes.find((n) => n.id === editingNodeId),
    [nodes, editingNodeId],
  );

  return {
    nodes: nodesWithCallbacks,
    edges,
    onNodesChange: onNodesChangeWrapped,
    onEdgesChange: onEdgesChangeWrapped,
    onNodeDragStart,
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
