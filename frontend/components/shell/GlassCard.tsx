import { cn } from "../../lib/utils";

export function GlassCard({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("tg-glass rounded-2xl", className)}>{children}</div>;
}