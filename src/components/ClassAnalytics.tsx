import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, Calendar, AlertTriangle } from "lucide-react";

interface ClassAnalyticsProps {
  classData: {
    name: string;
    code: string;
    students: number;
    present: number;
    late: number;
    absent: number;
    attendanceRate: number;
  };
}

export const ClassAnalytics = ({ classData }: ClassAnalyticsProps) => {
  const weeklyData = [
    { day: "Mon", attendance: 92 },
    { day: "Tue", attendance: 88 },
    { day: "Wed", attendance: 95 },
    { day: "Thu", attendance: 87 },
    { day: "Fri", attendance: 91 },
  ];

  const riskStudents = [
    { name: "Charlie Brown", absences: 8, risk: "high" },
    { name: "Eva Martinez", absences: 6, risk: "medium" },
    { name: "Sam Thompson", absences: 5, risk: "low" },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-blue-600 bg-blue-50";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const currentAttendance = Math.round((classData.present / classData.students) * 100);

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Today's Rate</div>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-foreground">{currentAttendance}%</div>
          <div className="text-xs text-green-600 mt-1">+3% from yesterday</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Semester Avg</div>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{classData.attendanceRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">20 classes total</div>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4">Weekly Attendance Trend</h3>
        <div className="space-y-3">
          {weeklyData.map((day, index) => (
            <div key={day.day} className="flex items-center gap-3">
              <div className="w-8 text-sm text-muted-foreground">{day.day}</div>
              <div className="flex-1">
                <Progress value={day.attendance} className="h-2" />
              </div>
              <div className="w-12 text-sm font-medium text-right">{day.attendance}%</div>
            </div>
          ))}
        </div>
      </Card>

      {/* At-Risk Students */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">At-Risk Students</h3>
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
        </div>
        <div className="space-y-3">
          {riskStudents.map((student, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.absences} absences</p>
                </div>
              </div>
              <Badge variant="outline" className={getRiskColor(student.risk)}>
                {student.risk} risk
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Attendance Patterns */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4">Attendance Patterns</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">85%</div>
            <div className="text-xs text-green-700">Perfect Attendance</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">12%</div>
            <div className="text-xs text-yellow-700">Frequent Latecomers</div>
          </div>
        </div>
        
        <div className="mt-4 text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">3 students</div>
          <div className="text-xs text-red-700">Risk of AF (≥15 absences)</div>
        </div>
      </Card>

      {/* Quick Insights */}
      <Card className="p-4 bg-blue-50">
        <h3 className="font-semibold text-blue-900 mb-3">💡 Insights & Recommendations</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Monday classes have the lowest attendance (87%)</p>
          <p>• 3 students are approaching the absence limit</p>
          <p>• Overall trend is positive with +2% improvement this month</p>
          <p>• Consider sending reminders to at-risk students</p>
        </div>
      </Card>
    </div>
  );
};