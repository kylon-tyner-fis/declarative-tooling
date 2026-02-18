"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Service Registry Actions ---

export async function createService(formData: FormData) {
  const supabase = await createClient(); // No arguments needed now

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("services").insert({
    name,
    description,
    flow_state: { nodes: [], edges: [] },
  });

  if (error) {
    console.error("Create Error:", error);
    throw new Error("Failed to create service");
  }

  revalidatePath("/services");
}

export async function deleteService(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    console.error("Delete Error:", error);
    throw new Error("Failed to delete service");
  }

  revalidatePath("/services");
}

// --- Diagram Actions (Fixing the missing name error) ---

export async function saveDiagram(id: string, nodes: any[], edges: any[]) {
  const supabase = await createClient();

  // Save the entire flow state as a JSON object
  const { error } = await supabase
    .from("services")
    .update({
      flow_state: { nodes, edges },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Save Error:", error);
    throw new Error("Failed to save diagram");
  }

  return { success: true };
}
