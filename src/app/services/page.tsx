import { createClient } from "@/lib/supabase/server";
import { ServiceList } from "@/components/services/ServiceList";

// Force dynamic because we want real-time list updates
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const supabase = await createClient();

  // 1. Fetch data on the server
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return <div>Error loading services</div>;
  }

  // 2. Pass data to the Client Component
  return <ServiceList initialServices={services || []} />;
}
