import { ReactNode } from "react";

export interface UIWidgetProps {
  value: any;
  onChange: (value: any) => void;
  schema: any;
  label: string;
}

export interface UIPlugin {
  id: string;
  name: string;
  // A predicate to determine if this plugin should handle a specific field
  match: (key: string, schema: any) => boolean;
  // The component to render
  component: (props: UIWidgetProps) => ReactNode;
}
