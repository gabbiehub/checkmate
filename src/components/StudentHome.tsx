import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Bell, BookOpen, Clock, Users, TrendingUp, Calendar, QrCode, AlertCircle } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";

interface StudentHomeProps {
  onClassSelect?: (classId: string) => void;
  onJoinClass?: () => void;
}

export const StudentHome = ({ onClassSelect, onJoinClass }: StudentHomeProps) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch real student classes
  const myClasses = useQuery(
    api.classes.getStudentClasses,
    user ? { studentId: user.userId } : "skip"
  );

  // Fetch reminders (includes class-wide reminders)
  const reminders = useQuery(
    api.eventsAndReminders.getUserReminders,
    user ? { userId: user.userId } : "skip"
  );

  // Fetch today's events
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = useQuery(
    api.eventsAndReminders.getEventsInRange,
    user ? { 
      userId: user.userId,
      startDate: todayStr,
      endDate: todayStr,
    } : "skip"
  );

  // Get upcoming reminders (next 7 days)
  const weekFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const upcomingReminders = reminders?.filter(r => 
    !r.completed && r.dueDate >= todayStr && r.dueDate <= weekFromNow
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3) || [];

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

  const notificationCount = reminders?.filter(r => !r.completed && r.dueDate <= todayStr).length || 0;

  if (!user || !myClasses) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Good morning, {user.name.split(' ')[0]}!</h1>
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
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {notificationCount}
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
            title="Active Classes"
            value={myClasses.length.toString()}
            icon={<BookOpen className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Students"
            value={myClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0).toString()}
            icon={<Users className="w-5 h-5" />}
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
          <CardContent>
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
              <p className="text-center text-muted-foreground py-4">No events scheduled for today</p>
            )}
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
                key={cls._id}
                className="p-4 border rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onClassSelect?.(cls._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-4 h-4 rounded bg-primary" />
                    <div>
                      <h3 className="font-semibold">{cls.description || cls.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cls.name}{cls.schedule && ` • ${cls.schedule}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{cls.studentCount || 0} students</Badge>
                </div>
              </div>
            ))}
            {myClasses.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You're not enrolled in any classes yet</p>
                <Button onClick={onJoinClass}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Join a Class
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Upcoming Reminders
            </CardTitle>
            <CardDescription>
              Reminders from you and your teachers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => {
                  const isOverdue = new Date(reminder.dueDate) < new Date();
                  const isClassWide = (reminder as any).isClassWide;
                  const className = (reminder as any).className;
                  
                  return (
                    <div 
                      key={reminder._id} 
                      className={`p-3 rounded-lg border ${
                        isOverdue ? 'bg-red-50 border-red-200' : 'bg-accent/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{reminder.title}</h4>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                      {isClassWide && className && (
                        <Badge variant="outline" className="text-xs mb-2">
                          {className}
                        </Badge>
                      )}
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {reminder.description.split('\n')[0]}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No upcoming reminders
              </p>
            )}
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