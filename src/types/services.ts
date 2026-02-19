export type ServiceNodeData = {
  label: string;
  definition: string;
  inputSchema: string;
  outputSchema: string;
  plugins?: Array<{
    pluginId: string;
    label: string;
    targetProperty: string;
    config: Array<{ key: string; value: string }>;
  }>;
  onEdit?: (id: string) => void;
  onViewSchema?: (title: string, type: string, content: string) => void;
  onPlay?: (id: string) => void;
};

export interface ServiceEntry {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  created_at: string;
  flow_state?: {
    nodes: any[];
    edges: any[];
  };
}
