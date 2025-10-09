import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Bell, BookOpen, Clock, Users, TrendingUp, Calendar, QrCode } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { NotificationsDialog } from "@/components/NotificationsDialog";

interface StudentHomeProps {
  onClassSelect?: (classId: string) => void;
  onJoinClass?: () => void;
}

export const StudentHome = ({ onClassSelect, onJoinClass }: StudentHomeProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "Math 101 class starts in 30 minutes", type: "reminder" },
    { id: 2, message: "Assignment due tomorrow for Physics", type: "assignment" }
  ]);

  const upcomingClasses = [
    {
      id: "1",
      name: "Math 101",
      instructor: "Dr. Johnson",
      time: "09:00 AM",
      room: "Room 205",
      status: "upcoming"
    },
    {
      id: "2", 
      name: "Physics 201",
      instructor: "Prof. Smith",
      time: "11:30 AM", 
      room: "Lab 3",
      status: "upcoming"
    }
  ];

  const myClasses = [
    {
      id: "1",
      name: "Math 101 - Algebra",
      instructor: "Dr. Sarah Johnson",
      schedule: "Mon, Wed, Fri - 9:00 AM",
      attendance: 92,
      nextClass: "Today at 9:00 AM",
      color: "bg-blue-500"
    },
    {
      id: "2",
      name: "Physics 201 - Mechanics", 
      instructor: "Prof. Michael Smith",
      schedule: "Tue, Thu - 11:30 AM",
      attendance: 88,
      nextClass: "Tomorrow at 11:30 AM",
      color: "bg-green-500"
    },
    {
      id: "3",
      name: "Chemistry 101",
      instructor: "Dr. Emily Brown",
      schedule: "Mon, Wed - 2:00 PM",
      attendance: 95,
      nextClass: "Wed at 2:00 PM",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Good morning, Alex!</h1>
            <p className="text-muted-foreground">Ready for another great day of learning?</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {notifications.length}
                </Badge>
              )}
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onJoinClass} className="h-auto p-4 flex flex-col items-center gap-2">
            <QrCode className="w-6 h-6" />
            <span className="text-sm font-medium">Join Class</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Calendar className="w-6 h-6" />
            <span className="text-sm font-medium">Schedule</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            title="Overall Attendance"
            value="92%"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatsCard
            title="Active Classes"
            value="3"
            icon={<BookOpen className="w-5 h-5" />}
          />
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingClasses.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cls.instructor} • {cls.room}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{cls.time}</p>
                  <Badge variant="secondary" className="text-xs">
                    {cls.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Classes
            </CardTitle>
            <CardDescription>
              Your enrolled classes and attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-4 border rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onClassSelect?.(cls.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${cls.color}`} />
                    <div>
                      <h3 className="font-semibold">{cls.name}</h3>
                      <p className="text-sm text-muted-foreground">{cls.instructor}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{cls.attendance}%</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-medium">{cls.attendance}%</span>
                  </div>
                  <Progress value={cls.attendance} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center mt-3 text-sm">
                  <span className="text-muted-foreground">{cls.schedule}</span>
                  <span className="font-medium text-primary">{cls.nextClass}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-sm">{notification.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>

  <NotificationsDialog 
    open={showNotifications} 
    onOpenChange={setShowNotifications}
    userType="student"
  />
</div>
);
};