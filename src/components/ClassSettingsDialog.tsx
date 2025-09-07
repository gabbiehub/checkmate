import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClassSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

export const ClassSettingsDialog = ({ open, onOpenChange, classId }: ClassSettingsDialogProps) => {
  const { toast } = useToast();
  const [classBeadles, setClassBeadles] = useState([
    { id: "1", name: "Emma Wilson", email: "emma.wilson@student.edu" },
    { id: "2", name: "James Chen", email: "james.chen@student.edu" }
  ]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [settings, setSettings] = useState({
    className: "Math 101 - Algebra",
    description: "Introduction to algebraic concepts and problem-solving techniques.",
    autoMarkAbsent: true,
    allowLateSubmissions: false,
    sendReminders: true,
    requireConfirmation: false
  });

  const allStudents = [
    { id: "3", name: "Sarah Johnson", email: "sarah.j@student.edu" },
    { id: "4", name: "Michael Brown", email: "michael.b@student.edu" },
    { id: "5", name: "Lisa Wang", email: "lisa.w@student.edu" },
    { id: "6", name: "David Miller", email: "david.m@student.edu" }
  ];

  const availableStudents = allStudents.filter(
    student => !classBeadles.some(beadle => beadle.id === student.id)
  );

  const handleAddBeadle = () => {
    if (selectedStudent) {
      const student = allStudents.find(s => s.id === selectedStudent);
      if (student) {
        setClassBeadles(prev => [...prev, student]);
        setSelectedStudent("");
      }
    }
  };

  const handleRemoveBeadle = (beadleId: string) => {
    setClassBeadles(prev => prev.filter(beadle => beadle.id !== beadleId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Settings Updated",
      description: "Class settings have been saved successfully.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Class Settings</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input
                id="className"
                value={settings.className}
                onChange={(e) => setSettings(prev => ({ ...prev, className: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Class Beadles</h3>
            <p className="text-sm text-muted-foreground">
              Class beadles help with attendance tracking and class management.
            </p>

            <div className="space-y-3">
              {classBeadles.map((beadle) => (
                <div key={beadle.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{beadle.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{beadle.name}</p>
                      <p className="text-sm text-muted-foreground">{beadle.email}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBeadle(beadle.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a student to add as beadle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddBeadle}
                  disabled={!selectedStudent}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Attendance Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoMarkAbsent">Auto Mark Absent</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically mark students as absent after class time
                </p>
              </div>
              <Switch
                id="autoMarkAbsent"
                checked={settings.autoMarkAbsent}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoMarkAbsent: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowLateSubmissions">Allow Late Submissions</Label>
                <p className="text-sm text-muted-foreground">
                  Allow attendance marking after deadline
                </p>
              </div>
              <Switch
                id="allowLateSubmissions"
                checked={settings.allowLateSubmissions}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowLateSubmissions: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sendReminders">Send Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send attendance reminders to students
                </p>
              </div>
              <Switch
                id="sendReminders"
                checked={settings.sendReminders}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendReminders: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireConfirmation">Require Confirmation</Label>
                <p className="text-sm text-muted-foreground">
                  Students must confirm their attendance
                </p>
              </div>
              <Switch
                id="requireConfirmation"
                checked={settings.requireConfirmation}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireConfirmation: checked }))}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Settings
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};