"use client";

import { ServiceNodeData } from "@/types/services";
import { Node } from "@xyflow/react";
import { NodeEditorDialog } from "./NodeEditorDialog";
import { PlaygroundDialog } from "./PlaygroundDialog";
import { SchemaViewerDialog } from "./SchemaViewerDialog";

interface DiagramDialogsProps {
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  nodeBeingEdited?: Node<ServiceNodeData>;
  isNewNode: boolean;
  saveNodeChanges: (data: Partial<ServiceNodeData>) => void;
  generationContext: string;

  testingNode: Node<ServiceNodeData> | null;
  setTestingNode: (node: Node<ServiceNodeData> | null) => void;

  viewingSchema: { title: string; type: string; content: string } | null;
  setViewingSchema: (val: null) => void;
}

export function DiagramDialogs({
  editingNodeId,
  setEditingNodeId,
  nodeBeingEdited,
  isNewNode,
  saveNodeChanges,
  generationContext,
  testingNode,
  setTestingNode,
  viewingSchema,
  setViewingSchema,
}: DiagramDialogsProps) {
  return (
    <>
      {nodeBeingEdited && (
        <NodeEditorDialog
          isOpen={!!editingNodeId}
          onClose={() => setEditingNodeId(null)}
          initialData={nodeBeingEdited.data}
          isNewNode={isNewNode}
          onSave={saveNodeChanges}
          contextSchema={generationContext}
          nodeType={nodeBeingEdited.type}
        />
      )}

      <PlaygroundDialog
        node={testingNode}
        onClose={() => setTestingNode(null)}
      />

      <SchemaViewerDialog
        data={viewingSchema}
        onClose={() => setViewingSchema(null)}
      />
    </>
  );
}
