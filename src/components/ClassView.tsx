import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Users, 
  QrCode, 
  Settings, 
  Calendar, 
  Bell,
  BarChart3,
  UserCheck,
  UserX,
  Clock
} from "lucide-react";
import { SeatingChart } from "./SeatingChart";
import { StudentList } from "./StudentList";
import { ClassAnalytics } from "./ClassAnalytics";

interface ClassViewProps {
  classId: string;
  onBack: () => void;
}

export const ClassView = ({ classId, onBack }: ClassViewProps) => {
  const [activeTab, setActiveTab] = useState("seating");
  
  // Mock class data
  const classData = {
    id: "1",
    name: "Computer Science 101",
    code: "CS101", 
    schedule: "MWF 10:00 AM",
    room: "Room 304",
    students: 45,
    present: 38,
    late: 3,
    absent: 4,
    attendanceRate: 89
  };

  const todayStats = {
    total: classData.students,
    present: classData.present,
    late: classData.late,
    absent: classData.absent
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/10 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{classData.name}</h1>
            <p className="text-primary-foreground/80 text-sm">
              {classData.code} • {classData.schedule}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10 p-2">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Today's Attendance Summary */}
        <Card className="bg-white/10 border-white/20 text-primary-foreground">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Today's Attendance</h3>
              <Clock className="w-4 h-4" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{todayStats.total}</div>
                <div className="text-xs text-primary-foreground/70">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">{todayStats.present}</div>
                <div className="text-xs text-primary-foreground/70">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{todayStats.late}</div>
                <div className="text-xs text-primary-foreground/70">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300">{todayStats.absent}</div>
                <div className="text-xs text-primary-foreground/70">Absent</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-3 mb-6">
        <div className="flex gap-3">
          <Button className="flex-1 bg-card shadow-card hover:shadow-soft">
            <QrCode className="w-4 h-4 mr-2" />
            Show Class Code
          </Button>
          <Button variant="outline" className="flex-1">
            <Bell className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full bg-muted">
            <TabsTrigger value="seating">Seating</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="seating" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Classroom Layout</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <UserCheck className="w-4 h-4 mr-1" />
                  Mark All Present
                </Button>
              </div>
            </div>
            <SeatingChart />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Student List</h3>
              <Badge variant="outline">
                {classData.students} students
              </Badge>
            </div>
            <StudentList />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <ClassAnalytics classData={classData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};