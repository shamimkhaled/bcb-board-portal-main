import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardWidgetCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardWidgetCard({
  title,
  children,
  className,
  contentClassName
}: DashboardWidgetCardProps) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle className="leading-6">{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
