"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ServiceEntry {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
}

// Hydration-safe helper to detect client-side mounting
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function ServicesPage() {
  // Initialize state directly from localStorage if possible (Lazy Initialization)
  const [services, setServices] = useState<ServiceEntry[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("service-registry");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const isMounted = useIsMounted();

  // Effect now only handles synchronization to localStorage when state changes
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

  if (!isMounted) return null;

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Service Registry
          </h1>
          <p className="text-muted-foreground">
            Manage architectures for your cloud services.
          </p>
        </div>
        <NewServiceDialog onCreate={createService} />
      </div>

      {services.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">No services created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="group hover:border-primary/50 transition-all shadow-sm"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="truncate pr-4">
                    {service.name}
                  </CardTitle>
                  <Cog className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {service.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between border-t pt-4 bg-muted/20 rounded-b-xl">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteService(service.id)}
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Link href={`/diagram/${service.id}`}>
                  <Button size="sm" className="gap-2">
                    Open Diagram <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewServiceDialog({
  onCreate,
}: {
  onCreate: (n: string, d: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = () => {
    if (!name) return;
    onCreate(name, desc);
    setName("");
    setDesc("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" /> New Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Service Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. User Auth"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What does this do?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Create Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
