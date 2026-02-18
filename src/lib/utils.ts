import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatJson = (jsonString: string) => {
  if (!jsonString) return "";
  try {
    const parsed =
      typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
};

export const mergeSchemas = (schemas: string[]): string => {
  const mergedProps: Record<string, any> = {};
  const mergedRequired: string[] = [];

  schemas.forEach((s) => {
    try {
      const parsed = JSON.parse(s);
      const props = parsed.properties || {};
      Object.assign(mergedProps, props);
      if (Array.isArray(parsed.required)) {
        mergedRequired.push(...parsed.required);
      }
    } catch (e) {
      console.warn("Could not parse schema for merging", e);
    }
  });

  return JSON.stringify(
    {
      type: "object",
      properties: mergedProps,
      required: Array.from(new Set(mergedRequired)),
    },
    null,
    2,
  );
};
