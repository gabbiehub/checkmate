import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, ChevronRight, QrCode } from "lucide-react";

interface ClassCardProps {
  id: number;
  name: string;
  code: string;
  description?: string;
  schedule?: string;
  students: number;
  attendance: number;
  onClick?: () => void;
}

export const ClassCard = ({ name, code, description, schedule, students, attendance, onClick }: ClassCardProps) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="p-4 shadow-card hover:shadow-soft transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            {description || name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {name}{schedule && ` • ${schedule}`}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="p-2">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{students}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{attendance}%</span>
            <div className={`w-2 h-2 rounded-full ${getAttendanceColor(attendance)}`}></div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3">
            <QrCode className="w-3 h-3 mr-1" />
            Code
          </Button>
        </div>
      </div>
    </Card>
  );
};