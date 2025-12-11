import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Bell, Clock, BookOpen, AlertCircle, GraduationCap, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface BeadleSchedulerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string; // Optional pre-selected class ID
  defaultTab?: "event" | "reminder";
}

export const BeadleSchedulerDialog = ({ 
  open, 
  onOpenChange, 
  classId: preSelectedClassId,
  defaultTab = "event"
}: BeadleSchedulerDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"event" | "reminder">(defaultTab);
  const [date, setDate] = useState<Date>();
  
  // Event form data
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    time: "",
    classId: preSelectedClassId || "",
    eventType: "activity",
    scheduleNotification: true,
    notificationMinutesBefore: "60",
  });

  // Reminder form data
  const [reminderData, setReminderData] = useState({
    title: "",
    description: "",
    time: "",
    classId: preSelectedClassId || "",
    scheduleNotification: true,
    notificationMinutesBefore: "60",
  });

  const createEvent = useMutation(api.eventsAndReminders.createEvent);
  const createReminder = useMutation(api.eventsAndReminders.createReminder);

  // Get classes where user is a beadle
  const beadleClasses = useQuery(
    api.eventsAndReminders.getBeadleClasses,
    user ? { userId: user.userId } : "skip"
  );

  // Update classId when preSelectedClassId changes or dialog opens
  useEffect(() => {
    if (open && preSelectedClassId) {
      setEventData(prev => ({ ...prev, classId: preSelectedClassId }));
      setReminderData(prev => ({ ...prev, classId: preSelectedClassId }));
    }
  }, [open, preSelectedClassId]);

  // Reset tab when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const eventTypes = [
    { value: "exam", label: "Exam", icon: GraduationCap },
    { value: "activity", label: "Activity", icon: BookOpen },
    { value: "deadline", label: "Deadline", icon: AlertCircle },
    { value: "other", label: "Other", icon: Clock }
  ];

  const notificationOptions = [
    { value: "15", label: "15 minutes before" },
    { value: "30", label: "30 minutes before" },
    { value: "60", label: "1 hour before" },
    { value: "120", label: "2 hours before" },
    { value: "1440", label: "1 day before" },
  ];

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !date || !eventData.title.trim() || !eventData.classId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createEvent({
        title: eventData.title.trim(),
        description: eventData.description.trim() || undefined,
        date: format(date, 'yyyy-MM-dd'),
        time: eventData.time || undefined,
        eventType: eventData.eventType as any,
        classId: eventData.classId as any,
        createdBy: user.userId,
        isPersonal: false,
        scheduleNotification: eventData.scheduleNotification,
        notificationMinutesBefore: eventData.scheduleNotification ? parseInt(eventData.notificationMinutesBefore) : undefined,
      });

      const notificationText = eventData.scheduleNotification 
        ? " Students will be notified." 
        : "";
      
      toast({
        title: "Event Created",
        description: `Event scheduled for ${format(date, "MMM dd, yyyy")}.${notificationText}`,
      });
      
      onOpenChange(false);
      resetForms();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !date || !reminderData.title.trim() || !reminderData.classId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createReminder({
        userId: user.userId,
        classId: reminderData.classId as any,
        title: reminderData.title.trim(),
        description: reminderData.description.trim() || undefined,
        dueDate: format(date, 'yyyy-MM-dd'),
        dueTime: reminderData.time || undefined,
        isClassWide: true,
        scheduleNotification: reminderData.scheduleNotification,
        notificationMinutesBefore: reminderData.scheduleNotification ? parseInt(reminderData.notificationMinutesBefore) : undefined,
      });

      const notificationText = reminderData.scheduleNotification 
        ? " Students will be notified." 
        : "";
      
      toast({
        title: "Reminder Created",
        description: `Reminder scheduled for ${format(date, "MMM dd, yyyy")}.${notificationText}`,
      });
      
      onOpenChange(false);
      resetForms();
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create reminder",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForms = () => {
    setEventData({
      title: "",
      description: "",
      time: "",
      classId: preSelectedClassId || "",
      eventType: "activity",
      scheduleNotification: true,
      notificationMinutesBefore: "60",
    });
    setReminderData({
      title: "",
      description: "",
      time: "",
      classId: preSelectedClassId || "",
      scheduleNotification: true,
      notificationMinutesBefore: "60",
    });
    setDate(undefined);
  };

  const handleEventChange = (field: string, value: string | boolean) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleReminderChange = (field: string, value: string | boolean) => {
    setReminderData(prev => ({ ...prev, [field]: value }));
  };

  if (!beadleClasses || beadleClasses.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Event or Reminder</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            <CalendarPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>You need to be a class beadle to schedule events and reminders.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule for Class</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "event" | "reminder")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger value="reminder">Reminder</TabsTrigger>
          </TabsList>

          <TabsContent value="event" className="space-y-4 mt-4">
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-class">Class *</Label>
                <Select 
                  value={eventData.classId} 
                  onValueChange={(value) => handleEventChange("classId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {beadleClasses.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-title">Event Title *</Label>
                <Input
                  id="event-title"
                  placeholder="Enter event title"
                  value={eventData.title}
                  onChange={(e) => handleEventChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={eventData.eventType} onValueChange={(value) => handleEventChange("eventType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MMM dd") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-time">Time</Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={eventData.time}
                    onChange={(e) => handleEventChange("time", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  placeholder="Add event details or location"
                  value={eventData.description}
                  onChange={(e) => handleEventChange("description", e.target.value)}
                  rows={2}
                />
              </div>

              {/* Notification section */}
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="event-notification" className="font-medium">
                      Notify Students
                    </Label>
                  </div>
                  <Switch
                    id="event-notification"
                    checked={eventData.scheduleNotification}
                    onCheckedChange={(checked) => handleEventChange("scheduleNotification", checked)}
                  />
                </div>
                
                {eventData.scheduleNotification && (
                  <Select 
                    value={eventData.notificationMinutesBefore} 
                    onValueChange={(value) => handleEventChange("notificationMinutesBefore", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="reminder" className="space-y-4 mt-4">
            <form onSubmit={handleReminderSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminder-class">Class *</Label>
                <Select 
                  value={reminderData.classId} 
                  onValueChange={(value) => handleReminderChange("classId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {beadleClasses.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-title">Reminder Title *</Label>
                <Input
                  id="reminder-title"
                  placeholder="Enter reminder title"
                  value={reminderData.title}
                  onChange={(e) => handleReminderChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MMM dd") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    value={reminderData.time}
                    onChange={(e) => handleReminderChange("time", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-description">Description</Label>
                <Textarea
                  id="reminder-description"
                  placeholder="Add reminder details"
                  value={reminderData.description}
                  onChange={(e) => handleReminderChange("description", e.target.value)}
                  rows={2}
                />
              </div>

              {/* Notification section */}
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="reminder-notification" className="font-medium">
                      Send Push Notification
                    </Label>
                  </div>
                  <Switch
                    id="reminder-notification"
                    checked={reminderData.scheduleNotification}
                    onCheckedChange={(checked) => handleReminderChange("scheduleNotification", checked)}
                  />
                </div>
                
                {reminderData.scheduleNotification && (
                  <Select 
                    value={reminderData.notificationMinutesBefore} 
                    onValueChange={(value) => handleReminderChange("notificationMinutesBefore", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Reminder"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
