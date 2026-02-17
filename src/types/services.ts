export type ServiceNodeData = {
  label: string;
  definition: string;
  inputSchema: string;
  outputSchema: string;
  onEdit?: (id: string) => void;
  onViewSchema?: (title: string, type: string, content: string) => void;
};

export interface ServiceEntry {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
}
