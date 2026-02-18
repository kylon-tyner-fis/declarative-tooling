"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const testConnection = async () => {
      const client = await createClient();
      const { data, error } = await client.from("test").select("*").limit(1);
      console.log("Supabase Test:", { data, error });
    };
    testConnection();
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Hello World</h1>
      <Button>Click Me</Button>
    </main>
  );
}
