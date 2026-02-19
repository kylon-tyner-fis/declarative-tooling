import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ServiceRunnerClient } from "./ServiceRunnerClient";

export default async function RunServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !service) notFound();

  const flow = service.flow_state || { nodes: [], edges: [] };

  // Find the "root" node: a node that has no incoming edges
  const targetNodeIds = new Set(flow.edges.map((e: any) => e.target));
  const startNode = flow.nodes.find((n: any) => !targetNodeIds.has(n.id));

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <ServiceRunnerClient
          serviceName={service.name}
          startNode={startNode}
          fullFlow={flow}
        />
      </div>
    </div>
  );
}
