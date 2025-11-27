import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BookOpen, Clock, Users, AlertCircle, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string; // Optional pre-selected class ID
}

export const AddEventDialog = ({ open, onOpenChange, classId: preSelectedClassId }: AddEventDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time: "",
    classId: preSelectedClassId || "",
    eventType: "other",
    classType: "",
    eventScope: "class", // "class" or "personal"
  });

  const createEvent = useMutation(api.eventsAndReminders.createEvent);
  
  const teacherClasses = useQuery(
    api.classes.getTeacherClasses,
    user?.role === 'teacher' && user ? { teacherId: user.userId } : "skip"
  );
  
  const studentClasses = useQuery(
    api.classes.getStudentClasses,
    user?.role === 'student' && user ? { studentId: user.userId } : "skip"
  );

  const userClasses = user?.role === 'teacher' ? teacherClasses : studentClasses;

  // Update classId when preSelectedClassId changes or dialog opens
  useEffect(() => {
    if (open && preSelectedClassId) {
      setFormData(prev => ({ ...prev, classId: preSelectedClassId }));
    }
  }, [open, preSelectedClassId]);

  const eventTypes = [
    { value: "exam", label: "Exam", icon: GraduationCap },
    { value: "activity", label: "Activity", icon: BookOpen },
    { value: "class", label: "Class Session", icon: Users },
    { value: "deadline", label: "Deadline", icon: AlertCircle },
    { value: "other", label: "Other", icon: Clock }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !date || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // For class-wide events (teacher), classId is required
    if (user.role === 'teacher' && formData.eventScope === 'class' && !formData.classId) {
      toast({
        title: "Error",
        description: "Please select a class for class-wide events.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const isPersonal = user.role === 'student' || formData.eventScope === 'personal';
      
      await createEvent({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: format(date, 'yyyy-MM-dd'),
        time: formData.time || undefined,
        eventType: formData.eventType as any,
        classType: formData.classType ? formData.classType as any : undefined,
        classId: formData.classId ? formData.classId as any : undefined,
        createdBy: user.userId,
        isPersonal,
      });

      const scopeText = isPersonal ? "personal event" : "class event";
      
      toast({
        title: "Event Created",
        description: `Your ${scopeText} has been added to the calendar for ${format(date, "MMM dd, yyyy")}`,
      });
      
      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      time: "",
      classId: preSelectedClassId || "",
      eventType: "other",
      classType: "",
      eventScope: "class",
    });
    setDate(undefined);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
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

          {user?.role === 'teacher' && (
            <div className="space-y-2">
              <Label>Event Scope</Label>
              <RadioGroup value={formData.eventScope} onValueChange={(value) => handleInputChange("eventScope", value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="class" id="class" />
                  <Label htmlFor="class" className="font-normal cursor-pointer">
                    Class-wide (all students can see)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal" className="font-normal cursor-pointer">
                    Personal (only I can see)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {(user?.role === 'teacher' && formData.eventScope === 'class') || user?.role === 'student' ? (
            <div className="space-y-2">
              <Label htmlFor="class">
                {user?.role === 'teacher' ? 'Class *' : 'Related Class (Optional)'}
              </Label>
              {preSelectedClassId ? (
                // Show read-only class name when pre-selected
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {userClasses?.find((cls: any) => cls._id === preSelectedClassId)?.name || "Selected Class"}
                  </span>
                </div>
              ) : (
                // Show dropdown when no pre-selection
                <Select 
                  value={formData.classId} 
                  onValueChange={(value) => handleInputChange("classId", value)}
                  required={user?.role === 'teacher' && formData.eventScope === 'class'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {userClasses && userClasses.length > 0 ? (
                      userClasses.map((cls: any) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-classes" disabled>
                        No classes available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : null}

          {formData.eventType === 'class' && (
            <div className="space-y-2">
              <Label>Class Type</Label>
              <Select value={formData.classType} onValueChange={(value) => handleInputChange("classType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="async">Asynchronous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
              <Label htmlFor="time">Time (Optional)</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add event details or location"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

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
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
