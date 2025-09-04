import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatsCard = ({ title, value, icon, className }: StatsCardProps) => {
  return (
    <Card className={cn("p-3 text-center", className)}>
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="text-xs text-current/70 mb-1">{title}</p>
      <p className="text-lg font-bold text-current">{value}</p>
    </Card>
  );
};