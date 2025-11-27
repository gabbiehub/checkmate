import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Clock, AlertCircle, X, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType?: "teacher" | "student";
}

export const NotificationsDialog = ({ open, onOpenChange, userType = "teacher" }: NotificationsDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch reminders and events
  const reminders = useQuery(
    api.eventsAndReminders.getUserReminders,
    user ? { userId: user.userId } : "skip"
  );
  
  const todayEvents = useQuery(
    api.eventsAndReminders.getEventsInRange,
    user ? { 
      userId: user.userId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // Next 7 days
    } : "skip"
  );
  
  const toggleReminder = useMutation(api.eventsAndReminders.toggleReminder);

  const getNotificationIcon = (type: "reminder" | "event" | "overdue") => {
    switch (type) {
      case "reminder":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "event":
        return <Bell className="w-5 h-5 text-purple-500" />;
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const handleToggleReminder = async (reminderId: Id<"reminders">) => {
    try {
      await toggleReminder({ reminderId });
      toast({
        title: "Updated",
        description: "Reminder status updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  };

  // Combine and sort notifications
  const notifications = [
    ...(reminders || []).map(r => ({
      id: r._id,
      title: r.title,
      message: r.description || "Reminder",
      className: (r as any).className || null,
      type: new Date(r.dueDate) < new Date() && !r.completed ? "overdue" as const : "reminder" as const,
      date: r.dueDate,
      time: formatDistanceToNow(new Date(r.dueDate), { addSuffix: true }),
      read: r.completed,
      isReminder: true,
      isClassWide: (r as any).isClassWide || false,
      reminder: r,
    })),
    ...(todayEvents || []).map(e => ({
      id: e._id,
      title: e.title,
      message: `${e.className} - ${e.description || "Event"}`,
      className: e.className,
      type: "event" as const,
      date: e.date,
      time: formatDistanceToNow(new Date(e.date), { addSuffix: true }),
      read: false,
      isReminder: false,
      isClassWide: false,
      event: e,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const unreadCount = notifications.filter(n => !n.read && n.type !== "event").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Stay updated with your latest reminders and events
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  notification.read ? "bg-muted/30" : notification.type === "overdue" ? "bg-red-50 border-red-200" : "bg-accent/50 border-primary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        {notification.className && notification.isClassWide && (
                          <Badge variant="outline" className="text-xs mt-1 mr-1">
                            {notification.className}
                          </Badge>
                        )}
                        {notification.type === "overdue" && (
                          <Badge variant="destructive" className="text-xs mt-1">Overdue</Badge>
                        )}
                      </div>
                      {notification.isReminder && !notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs shrink-0"
                          onClick={() => handleToggleReminder(notification.id as Id<"reminders">)}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        Due: {format(new Date(notification.date), "MMM dd, yyyy")} • {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};