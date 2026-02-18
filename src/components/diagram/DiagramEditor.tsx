"use client";

import React, { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";

import { ServiceNode } from "@/components/diagram/ServiceNode";
import { DataNode } from "@/components/diagram/DataNode";
import { useDiagramLogic } from "@/hooks/useDiagramLogic";
import { ServiceNodeData } from "@/types/services";
import { DiagramToolbar } from "@/components/diagram/DiagramToolbar";
import { DiagramDialogs } from "@/components/diagram/DiagramDialogs";

interface DiagramEditorProps {
  serviceId: string;
  initialNodes: Node<ServiceNodeData>[];
  initialEdges: Edge[];
}

const nodeTypes = {
  service: ServiceNode,
  data: DataNode,
};

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function DiagramEditor({
  serviceId,
  initialNodes,
  initialEdges,
}: DiagramEditorProps) {
  const router = useRouter();
  const isMounted = useIsMounted();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onNodeDragStart, // <--- Destructure this
    setRfInstance,
    addNewNode,
    handleSave,
    dialogs,
  } = useDiagramLogic(serviceId, initialNodes, initialEdges);

  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col">
      <DiagramToolbar
        onBack={() => router.push("/services")}
        onAddAgent={() => addNewNode("service")}
        onAddData={() => addNewNode("data")}
        onSave={handleSave}
      />

      <div className="flex-1 relative">
        <ReactFlow<Node<ServiceNodeData>>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeDragStart={onNodeDragStart} // <--- Pass it to ReactFlow
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      <DiagramDialogs
        editingNodeId={dialogs.editingNodeId}
        setEditingNodeId={dialogs.setEditingNodeId}
        nodeBeingEdited={dialogs.nodeBeingEdited}
        isNewNode={dialogs.isNewNode}
        saveNodeChanges={dialogs.saveNodeChanges}
        generationContext={dialogs.generationContext}
        testingNode={dialogs.testingNode}
        setTestingNode={dialogs.setTestingNode}
        viewingSchema={dialogs.viewingSchema}
        setViewingSchema={dialogs.setViewingSchema}
      />
    </div>
  );
}
