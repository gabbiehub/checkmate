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
import { CalendarIcon, Bell, Clock, Users, BookOpen, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddReminderDialog = ({ open, onOpenChange }: AddReminderDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    priority: "medium",
    reminderDate: undefined as Date | undefined,
    reminderTime: "",
    recipients: "me",
    classId: "",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const reminderTypes = [
    { value: "assignment", label: "Assignment Due", icon: BookOpen },
    { value: "exam", label: "Exam Reminder", icon: Clock },
    { value: "class", label: "Class Reminder", icon: Users },
    { value: "meeting", label: "Meeting", icon: Bell },
    { value: "general", label: "General Reminder", icon: Bell }
  ];

  const availableTags = ["Urgent", "Follow-up", "Preparation", "Deadline", "Meeting"];
  
  const classes = [
    { id: "cs101", name: "Computer Science 101" },
    { id: "math201", name: "Advanced Mathematics" },
    { id: "phys150", name: "Physics Laboratory" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Reminder Created",
      description: "Your reminder has been scheduled successfully.",
    });
    onOpenChange(false);
    resetForm();
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
    });
    setSelectedTags([]);
  };

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <Label htmlFor="class">Related Class (Optional)</Label>
            <Select value={formData.classId} onValueChange={(value) => handleInputChange("classId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    className="ml-1 h-auto p-0 w-4 h-4"
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
            <Select value={formData.recipients} onValueChange={(value) => handleInputChange("recipients", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Just Me</SelectItem>
                <SelectItem value="class">Entire Class</SelectItem>
                <SelectItem value="beadles">Class Beadles</SelectItem>
                <SelectItem value="custom">Custom Recipients</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Reminder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};