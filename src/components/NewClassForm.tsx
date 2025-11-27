import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Users, MapPin, Clock, BookOpen, Hash, Layout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SeatPlanBuilder } from "./SeatPlanBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NewClassFormProps {
  onBack: () => void;
  onClassCreated: (classId: string) => void;
}

export const NewClassForm = ({ onBack, onClassCreated }: NewClassFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const createClass = useMutation(api.classes.createClass);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    subject: "",
    schedule: "",
    room: "",
    semester: "",
    capacity: "",
    description: ""
  });
  
  const [seatPlan, setSeatPlan] = useState<{ rows: number; columns: number; layout: string[][] } | null>(null);

  const generateClassCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in class name and subject.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a class.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create the class in Convex
      const result = await createClass({
        name: formData.name,
        description: formData.description || formData.subject,
        teacherId: user.userId,
        code: formData.code.trim() || undefined, // Pass custom code if provided
        schedule: formData.schedule.trim() || undefined, // Pass schedule if provided
      });

      toast({
        title: "Class Created Successfully!",
        description: `${formData.name} has been created with code ${result.code}`,
      });

      // Navigate to the newly created class view with the real Convex ID
      onClassCreated(result.classId);
    } catch (error) {
      toast({
        title: "Error Creating Class",
        description: error instanceof Error ? error.message : "Failed to create class",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Class</h1>
            <p className="text-primary-foreground/80">Set up your classroom</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 -mt-4">
        <Card className="p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Computer Science 101"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Programming Fundamentals"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Class Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    placeholder="Auto-generated or custom"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  />
                  <Button type="button" variant="outline" onClick={generateClassCode}>
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Schedule & Location</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    placeholder="e.g., MWF 10:00 AM"
                    value={formData.schedule}
                    onChange={(e) => handleInputChange("schedule", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    placeholder="e.g., Room 301"
                    value={formData.room}
                    onChange={(e) => handleInputChange("room", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select onValueChange={(value) => handleInputChange("semester", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st-2024">1st Semester 2024</SelectItem>
                      <SelectItem value="2nd-2024">2nd Semester 2024</SelectItem>
                      <SelectItem value="summer-2024">Summer 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Student Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 40"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Seat Plan Builder */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Classroom Layout</h2>
              </div>
              
              <SeatPlanBuilder onSeatPlanChange={setSeatPlan} />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description about the class..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};