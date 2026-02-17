import { Node, Edge } from "@xyflow/react";

export interface Service {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  // Persistent drawing state for this specific service
  nodes: Node<ServiceNodeData>[];
  edges: Edge[];
}

export type ServiceNodeData = {
  label: string;
  definition: string;
  inputSchema: string;
  outputSchema: string;
  onEdit?: (id: string) => void;
};
