import { createClient } from "@/lib/supabase/server";
import { DiagramEditor } from "@/components/diagram/DiagramEditor";
import { notFound } from "next/navigation";

export default async function DiagramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch the stored flow state
  const { data, error } = await supabase
    .from("services")
    .select("flow_state")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const initialFlow = data.flow_state || { nodes: [], edges: [] };

  // 2. Pass it to the editor
  return (
    <DiagramEditor
      serviceId={id}
      initialNodes={initialFlow.nodes}
      initialEdges={initialFlow.edges}
    />
  );
}
