export type ServiceNodeData = {
  label: string;
  definition: string;
  inputSchema: string; // Stored as stringified JSON in the node data
  outputSchema: string; // Stored as stringified JSON in the node data
  onEdit?: (id: string) => void;
  onViewSchema?: (title: string, type: string, content: string) => void;
  onPlay?: (id: string) => void;
};

// Matches the Supabase row structure
export interface ServiceEntry {
  id: string;
  name: string;
  description: string | null;
  updated_at: string;
  created_at: string;
  // We usually don't fetch this in the list view to keep it light
  flow_state?: {
    nodes: any[];
    edges: any[];
  };
}
