import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Clock, AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "reminder" | "assignment" | "announcement" | "alert";
  time: string;
  read: boolean;
}

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType?: "teacher" | "student";
}

export const NotificationsDialog = ({ open, onOpenChange, userType = "teacher" }: NotificationsDialogProps) => {
  const [notifications, setNotifications] = useState<Notification[]>(
    userType === "teacher" 
      ? [
          {
            id: 1,
            title: "Low Attendance Alert",
            message: "CS101 class attendance dropped to 75% this week",
            type: "alert",
            time: "10 minutes ago",
            read: false,
          },
          {
            id: 2,
            title: "Assignment Submissions",
            message: "12 new submissions for Math 201 homework",
            type: "assignment",
            time: "1 hour ago",
            read: false,
          },
          {
            id: 3,
            title: "Class Reminder",
            message: "Physics Lab starts in 30 minutes",
            type: "reminder",
            time: "2 hours ago",
            read: true,
          },
          {
            id: 4,
            title: "System Update",
            message: "New attendance tracking features available",
            type: "announcement",
            time: "Yesterday",
            read: true,
          },
        ]
      : [
          {
            id: 1,
            title: "Class Starting Soon",
            message: "Math 101 class starts in 30 minutes",
            type: "reminder",
            time: "Just now",
            read: false,
          },
          {
            id: 2,
            title: "Assignment Due",
            message: "Physics assignment due tomorrow at 11:59 PM",
            type: "assignment",
            time: "2 hours ago",
            read: false,
          },
          {
            id: 3,
            title: "Grade Posted",
            message: "Your Chemistry quiz grade is now available",
            type: "announcement",
            time: "5 hours ago",
            read: true,
          },
        ]
  );

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "reminder":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "assignment":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "announcement":
        return <Bell className="w-5 h-5 text-purple-500" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
            Stay updated with your latest notifications
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>

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
                  notification.read ? "bg-muted/30" : "bg-accent/50 border-primary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
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