"use client";

import Link from "next/link";
import { Trash2, ArrowRight, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { NewServiceDialog } from "./NewServiceDialog";
import { deleteService } from "@/app/actions"; // Import Server Action
import { useTransition } from "react";
import { ServiceEntry } from "@/types/services";

interface ServiceListProps {
  initialServices: ServiceEntry[];
}

export function ServiceList({ initialServices }: ServiceListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    // Wrap server action in transition to show loading state if needed
    startTransition(async () => {
      await deleteService(id);
    });
  };

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
        <NewServiceDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialServices.map((service) => (
          <Card
            key={service.id}
            className="group hover:border-primary/50 transition-all shadow-sm"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="truncate pr-4">{service.name}</CardTitle>
                <Cog className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="line-clamp-2 min-h-10">
                {service.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between border-t pt-4 bg-muted/20 rounded-b-xl">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(service.id)}
                disabled={isPending}
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
    </div>
  );
}
