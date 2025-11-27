import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Calendar, TrendingUp, Bell, QrCode, Clock } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { ClassCard } from "./ClassCard";
import { QRCodeDialog } from "./QRCodeDialog";
import { AddReminderDialog } from "./AddReminderDialog";
import { NotificationsDialog } from "./NotificationsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface TeacherHomeProps {
  onClassSelect?: (classId: string) => void;
  onNewClass?: () => void;
  onViewAllClasses?: () => void;
}

export const TeacherHome = ({ onClassSelect, onNewClass, onViewAllClasses }: TeacherHomeProps) => {
  const { user } = useAuth();
  const [showQRCode, setShowQRCode] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Fetch real data from Convex
  const teacherClasses = useQuery(
    api.classes.getTeacherClasses,
    user ? { teacherId: user.userId } : "skip"
  );
  
  const attendanceStats = useQuery(
    api.classes.getTeacherAttendanceStats,
    user ? { teacherId: user.userId } : "skip"
  );
  
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const todayEvents = useQuery(
    api.eventsAndReminders.getEventsInRange,
    user ? { 
      userId: user.userId,
      startDate: todayStr,
      endDate: todayStr,
    } : "skip"
  );
  
  const reminders = useQuery(
    api.eventsAndReminders.getUserReminders,
    user ? { userId: user.userId } : "skip"
  );

  // Process data
  const recentClasses = teacherClasses?.slice(0, 3) || [];
  const totalStudents = teacherClasses?.reduce((sum, c) => sum + (c.studentCount || 0), 0) || 0;
  
  // Get current date info
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Filter reminders for tomorrow or overdue
  const upcomingReminders = reminders?.filter(r => 
    !r.completed && r.dueDate <= tomorrowStr
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate)) || [];
  
  // Sort today's events by time (chronological order)
  const sortedTodayEvents = todayEvents?.sort((a, b) => {
    // Events with time come first, sorted by time
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    // If neither has time, sort by title
    return a.title.localeCompare(b.title);
  }) || [];
  
  // Count unread notifications (overdue reminders + today's events)
  const notificationCount = (upcomingReminders.filter(r => r.dueDate < todayStr).length) + 
    (todayEvents?.length || 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Teacher'}!</h1>
            <p className="text-primary-foreground/80 mt-1">{dayName}, {monthDay}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-primary-foreground hover:bg-white/10"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-6 h-6" />
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-xs font-bold">
                {notificationCount}
              </div>
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Button variant="secondary" className="flex-1 h-12" onClick={onNewClass}>
            <Plus className="w-4 h-4 mr-2" />
            New Class
          </Button>
          <Button 
            variant="outline" 
            className="px-4 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => setShowQRCode(true)}
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCard 
            title="Total Classes"
            value={teacherClasses?.length.toString() || "0"}
            icon={<Users className="w-4 h-4" />}
            className="bg-white/10 border-white/20"
          />
          <StatsCard 
            title="Active Students"
            value={totalStudents.toString()}
            icon={<TrendingUp className="w-4 h-4" />}
            className="bg-white/10 border-white/20"
          />
          <StatsCard 
            title="Avg. Attendance"
            value={attendanceStats?.averageAttendance ? `${attendanceStats.averageAttendance}%` : "N/A"}
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
          {sortedTodayEvents && sortedTodayEvents.length > 0 ? (
            <div className="space-y-3">
              {sortedTodayEvents.map((event) => (
                <div key={event._id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    {event.time ? (
                      <div className="text-sm font-semibold text-primary min-w-[60px]">
                        {event.time}
                      </div>
                    ) : (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.className}</p>
                      {event.classType && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {event.classType === "in-person" ? "In-Person" : 
                           event.classType === "online" ? "Online" : 
                           "Async"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {event.eventType || "event"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No events scheduled for today</p>
            </div>
          )}
        </Card>

        {/* Recent Classes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Classes</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={onViewAllClasses}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentClasses.map((classItem) => (
              <ClassCard 
                key={classItem._id} 
                id={0}
                name={classItem.name}
                code={classItem.code}
                description={classItem.description}
                schedule={classItem.schedule}
                students={classItem.studentCount}
                attendance={90}
                onClick={() => onClassSelect?.(classItem._id)}
              />
            ))}
            {recentClasses.length === 0 && (
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No classes yet</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={onNewClass}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Class
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Reminders */}
        <Card className="p-4 bg-gradient-warm shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Quick Reminders</h3>
            <Button size="sm" variant="outline" onClick={() => setShowAddReminder(true)}>
              Add Reminder
            </Button>
          </div>
          {upcomingReminders.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {upcomingReminders[0].title}
                {upcomingReminders[0].description && ` - ${upcomingReminders[0].description}`}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">Reminder</Badge>
                <Badge 
                  variant={upcomingReminders[0].dueDate < todayStr ? "destructive" : "outline"} 
                  className="text-xs"
                >
                  {upcomingReminders[0].dueDate < todayStr 
                    ? "Overdue" 
                    : upcomingReminders[0].dueDate === todayStr 
                    ? "Due Today" 
                    : "Due Tomorrow"}
                </Badge>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming reminders. Click "Add Reminder" to create one.
            </p>
          )}
        </Card>
        
        <QRCodeDialog 
          open={showQRCode} 
          onOpenChange={setShowQRCode}
          classData={{ name: "Math 101 - Algebra", code: "MATH101" }}
        />
        <AddReminderDialog 
          open={showAddReminder} 
          onOpenChange={setShowAddReminder}
        />
        <NotificationsDialog 
          open={showNotifications} 
          onOpenChange={setShowNotifications}
          userType="teacher"
        />
      </div>
    </div>
  );
};