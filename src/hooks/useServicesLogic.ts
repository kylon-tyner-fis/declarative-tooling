"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { ServiceEntry } from "@/types/services";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useServicesLogic() {
  const isMounted = useIsMounted();

  // Lazy initialization to avoid hydration mismatch
  const [services, setServices] = useState<ServiceEntry[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("service-registry");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Sync to localStorage whenever state changes
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("service-registry", JSON.stringify(services));
    }
  }, [services, isMounted]);

  const createService = (name: string, description: string) => {
    const newService: ServiceEntry = {
      id: crypto.randomUUID(),
      name,
      description,
      updatedAt: new Date().toISOString(),
    };
    setServices((prev) => [newService, ...prev]);
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    localStorage.removeItem(`drawing-${id}`);
  };

  return {
    services,
    createService,
    deleteService,
    isMounted,
  };
}
