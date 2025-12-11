import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Bell, Clock, Users, BookOpen, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddReminderDialog = ({ open, onOpenChange }: AddReminderDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    priority: "medium",
    reminderDate: undefined as Date | undefined,
    reminderTime: "",
    recipients: "me",
    classId: "",
    scheduleNotification: false,
    notificationMinutesBefore: "60",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Fetch teacher's classes
  const teacherClasses = useQuery(
    api.classes.getTeacherClasses,
    user?.role === "teacher" ? { teacherId: user.userId } : "skip"
  );

  // Get classes where user is a beadle
  const beadleClasses = useQuery(
    api.eventsAndReminders.getBeadleClasses,
    user?.role === "student" ? { userId: user.userId } : "skip"
  );
  
  // Mutation to create reminder
  const createReminder = useMutation(api.eventsAndReminders.createReminder);

  // Determine available classes for class-wide reminders
  const availableClasses = user?.role === "teacher" ? teacherClasses : beadleClasses;
  const canCreateClassWideReminders = user?.role === "teacher" || (beadleClasses && beadleClasses.length > 0);

  const notificationOptions = [
    { value: "15", label: "15 minutes before" },
    { value: "30", label: "30 minutes before" },
    { value: "60", label: "1 hour before" },
    { value: "120", label: "2 hours before" },
    { value: "1440", label: "1 day before" },
  ];
  
  const reminderTypes = [
    { value: "assignment", label: "Assignment Due", icon: BookOpen },
    { value: "exam", label: "Exam Reminder", icon: Clock },
    { value: "class", label: "Class Reminder", icon: Users },
    { value: "meeting", label: "Meeting", icon: Bell },
    { value: "general", label: "General Reminder", icon: Bell }
  ];

  const availableTags = ["Urgent", "Follow-up", "Preparation", "Deadline", "Meeting"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a reminder.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reminder title.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.reminderDate) {
      toast({
        title: "Error",
        description: "Please select a reminder date.",
        variant: "destructive",
      });
      return;
    }

    // Validate class selection for class-wide reminders
    const isClassWide = formData.recipients === "class" || formData.recipients === "beadles";
    if (isClassWide && !formData.classId) {
      toast({
        title: "Error",
        description: "Please select a class for class-wide reminders.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the date as ISO string
      const dueDate = formData.reminderDate.toISOString().split('T')[0];
      
      const classId = isClassWide && formData.classId ? formData.classId as any : undefined;
      
      // Build description with tags and type
      let fullDescription = formData.description || "";
      if (formData.type) {
        fullDescription = `[${reminderTypes.find(t => t.value === formData.type)?.label}] ${fullDescription}`;
      }
      if (selectedTags.length > 0) {
        fullDescription = `${fullDescription}\nTags: ${selectedTags.join(", ")}`;
      }
      if (formData.reminderTime) {
        fullDescription = `${fullDescription}\nTime: ${formData.reminderTime}`;
      }
      if (formData.priority !== "medium") {
        fullDescription = `${fullDescription}\nPriority: ${formData.priority}`;
      }
      if (isClassWide) {
        fullDescription = `${fullDescription}\nSent to: ${formData.recipients === "class" ? "Entire Class" : "Class Beadles"}`;
      }
      
      await createReminder({
        userId: user.userId,
        classId,
        title: formData.title.trim(),
        description: fullDescription.trim() || undefined,
        dueDate,
        dueTime: formData.reminderTime || undefined,
        isClassWide,
        scheduleNotification: isClassWide && formData.scheduleNotification,
        notificationMinutesBefore: formData.scheduleNotification ? parseInt(formData.notificationMinutesBefore) : undefined,
      });
      
      const recipientText = isClassWide 
        ? `for ${formData.recipients === "class" ? "entire class" : "class beadles"}`
        : "";
      const notificationText = isClassWide && formData.scheduleNotification 
        ? " Students will be notified." 
        : "";
      
      toast({
        title: "Reminder Created",
        description: `Your reminder has been scheduled for ${format(formData.reminderDate, "MMM dd, yyyy")} ${recipientText}.${notificationText}`,
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      priority: "medium",
      reminderDate: undefined,
      reminderTime: "",
      recipients: "me",
      classId: "",
      scheduleNotification: false,
      notificationMinutesBefore: "60",
    });
    setSelectedTags([]);
  };

  const handleInputChange = (field: string, value: string | Date | boolean | undefined) => {
    if (field === "scheduleNotification") {
      setFormData(prev => ({ ...prev, scheduleNotification: value === true }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Reminder</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Reminder Title</Label>
            <Input
              id="title"
              placeholder="Enter reminder title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Reminder Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select reminder type" />
              </SelectTrigger>
              <SelectContent>
                {reminderTypes.map((type) => {
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

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Reminder Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.reminderDate ? format(formData.reminderDate, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.reminderDate}
                    onSelect={(date) => handleInputChange("reminderDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.reminderTime}
                onChange={(e) => handleInputChange("reminderTime", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Related Class {(formData.recipients === "class" || formData.recipients === "beadles") ? "*" : "(Optional)"}</Label>
            <Select value={formData.classId} onValueChange={(value) => handleInputChange("classId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses && availableClasses.length > 0 ? (
                  availableClasses.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {user?.role === "student" 
                      ? "No classes available (you must be a beadle)" 
                      : "No classes available"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {user?.role === "student" && canCreateClassWideReminders && (
              <p className="text-xs text-muted-foreground">
                As a class beadle, you can create reminders for your classmates.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-1 p-0 w-4 h-4"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {availableTags.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter additional details..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipients">Send To</Label>
            <Select 
              value={formData.recipients} 
              onValueChange={(value) => handleInputChange("recipients", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Just Me</SelectItem>
                {canCreateClassWideReminders && (
                  <>
                    <SelectItem value="class">Entire Class</SelectItem>
                    <SelectItem value="beadles">Class Beadles Only</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notification scheduling - only for class-wide reminders */}
          {(formData.recipients === "class" || formData.recipients === "beadles") && formData.classId && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="notification-reminder" className="font-medium">
                    Send Push Notification
                  </Label>
                </div>
                <Switch
                  id="notification-reminder"
                  checked={formData.scheduleNotification}
                  onCheckedChange={(checked) => handleInputChange("scheduleNotification", checked)}
                />
              </div>
              
              {formData.scheduleNotification && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Send notification</Label>
                  <Select 
                    value={formData.notificationMinutesBefore} 
                    onValueChange={(value) => handleInputChange("notificationMinutesBefore", value)}
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
                  <p className="text-xs text-muted-foreground">
                    {formData.recipients === "class" 
                      ? "All students in this class will receive a push notification."
                      : "Class beadles will receive a push notification."}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
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
      </DialogContent>
    </Dialog>
  );
};