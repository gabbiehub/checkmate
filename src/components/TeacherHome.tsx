import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, TrendingUp, Bell, QrCode, Clock } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { ClassCard } from "./ClassCard";
import { QRCodeDialog } from "./QRCodeDialog";

interface TeacherHomeProps {
  onClassSelect?: (classId: string) => void;
  onNewClass?: () => void;
}

export const TeacherHome = ({ onClassSelect, onNewClass }: TeacherHomeProps) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const upcomingEvents = [
    { id: 1, title: "CS101 Midterm Exam", time: "2:00 PM", type: "exam" },
    { id: 2, title: "Physics Lab Session", time: "4:00 PM", type: "class" },
  ];

  const recentClasses = [
    { id: 1, name: "Computer Science 101", code: "CS101", students: 45, attendance: 89 },
    { id: 2, name: "Advanced Mathematics", code: "MATH201", students: 38, attendance: 92 },
    { id: 3, name: "Physics Laboratory", code: "PHYS150", students: 28, attendance: 85 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Prof. Smith!</h1>
            <p className="text-primary-foreground/80 mt-1">Tuesday, March 15, 2024</p>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Button variant="secondary" className="flex-1 h-12" onClick={onNewClass}>
            <Plus className="w-4 h-4 mr-2" />
            New Class
          </Button>
          <Button variant="outline" className="px-4 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20">
            <QrCode className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCard 
            title="Total Classes"
            value="12"
            icon={<Users className="w-4 h-4" />}
            className="bg-white/10 border-white/20"
          />
          <StatsCard 
            title="Active Students"
            value="420"
            icon={<TrendingUp className="w-4 h-4" />}
            className="bg-white/10 border-white/20"
          />
          <StatsCard 
            title="Avg. Attendance"
            value="89%"
            icon={<Calendar className="w-4 h-4" />}
            className="bg-white/10 border-white/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 space-y-6">
        {/* Today's Schedule */}
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
                <Badge variant={event.type === 'exam' ? 'destructive' : 'secondary'}>
                  {event.type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Classes</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentClasses.map((classItem) => (
              <ClassCard 
                key={classItem.id} 
                {...classItem} 
                onClick={() => onClassSelect?.(classItem.id.toString())}
              />
            ))}
          </div>
        </div>

        {/* Quick Reminders */}
        <Card className="p-4 bg-gradient-warm shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Quick Reminders</h3>
            <Button size="sm" variant="outline">
              Add Reminder
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Don't forget: CS101 assignment deadline is tomorrow
          </p>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">Assignment</Badge>
            <Badge variant="outline" className="text-xs">Due Tomorrow</Badge>
          </div>
        </Card>
        
        <QRCodeDialog 
          open={showQRCode} 
          onOpenChange={setShowQRCode}
          classData={{ name: "Math 101 - Algebra", code: "MATH101" }}
        />
      </div>
    </div>
  );
};