"use client";

import Link from "next/link";
import { Trash2, ArrowRight, Cog, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { NewServiceDialog } from "./NewServiceDialog";
import { deleteService } from "@/app/actions";
import { useTransition } from "react";
import { ServiceEntry } from "@/types/services";

interface ServiceListProps {
  initialServices: ServiceEntry[];
}

export function ServiceList({ initialServices }: ServiceListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteService(id);
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Service Registry
          </h1>
          <p className="text-muted-foreground">
            Manage and execute architectures for your cloud services.
          </p>
        </div>
        <NewServiceDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialServices.map((service) => (
          <Card
            key={service.id}
            className="group hover:border-primary/50 transition-all shadow-sm flex flex-col"
          >
            <CardHeader className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="truncate pr-4 text-lg">
                  {service.name}
                </CardTitle>
                <Cog className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardDescription className="line-clamp-2 min-h-10 mt-2 leading-relaxed">
                {service.description || "No description provided."}
              </CardDescription>
            </CardHeader>

            <CardFooter className="flex flex-col gap-3 border-t pt-4 bg-muted/20 rounded-b-xl">
              <div className="flex w-full justify-between items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(service.id)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 h-8 w-8"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Link href={`/run/${service.id}`} className="flex-1 px-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full gap-2 bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 border border-emerald-600/20 font-bold text-xs uppercase tracking-wider"
                  >
                    <Play className="size-3 fill-emerald-700" /> Run Service
                  </Button>
                </Link>
              </div>
              <Link href={`/diagram/${service.id}`} className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-[10px] font-black uppercase tracking-widest h-8 border-dashed"
                >
                  Modify Architecture <ArrowRight className="size-3" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
