import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { Id } from "../../convex/_generated/dataModel";

interface ClassSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

export const ClassSettingsDialog = ({ open, onOpenChange, classId }: ClassSettingsDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingBeadle, setIsAddingBeadle] = useState(false);
  const [isRemovingBeadle, setIsRemovingBeadle] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    className: "",
    description: "",
    autoMarkAbsent: true,
    allowLateSubmissions: false,
    sendReminders: true,
    requireConfirmation: false
  });

  // Fetch class settings from backend
  const classSettings = useQuery(api.classes.getClassSettings, {
    classId: classId as Id<"classes">,
  });

  // Fetch beadles and available students
  const beadles = useQuery(api.classes.getClassBeadles, {
    classId: classId as Id<"classes">,
  });

  const availableStudents = useQuery(api.classes.getAvailableStudentsForBeadle, {
    classId: classId as Id<"classes">,
  });

  // Mutations
  const updateSettings = useMutation(api.classes.updateClassSettings);
  const addBeadleMutation = useMutation(api.classes.addBeadle);
  const removeBeadleMutation = useMutation(api.classes.removeBeadle);

  // Update local state when class settings are fetched
  useEffect(() => {
    if (classSettings) {
      setSettings({
        className: classSettings.name,
        description: classSettings.description || "",
        autoMarkAbsent: classSettings.autoMarkAbsent,
        allowLateSubmissions: classSettings.allowLateSubmissions,
        sendReminders: classSettings.sendReminders,
        requireConfirmation: classSettings.requireConfirmation,
      });
    }
  }, [classSettings]);

  const handleAddBeadle = async () => {
    if (!selectedStudent || !user) {
      console.log("handleAddBeadle: missing selectedStudent or user", { selectedStudent, user });
      return;
    }

    setIsAddingBeadle(true);
    try {
      console.log("Adding beadle:", { classId, studentId: selectedStudent, teacherId: user.userId });
      await addBeadleMutation({
        classId: classId as Id<"classes">,
        studentId: selectedStudent as Id<"users">,
        teacherId: user.userId as Id<"users">,
      });
      setSelectedStudent("");
      toast({
        title: "Beadle Added",
        description: "Student has been assigned as a class beadle.",
      });
    } catch (error) {
      console.error("Failed to add beadle:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add beadle",
        variant: "destructive",
      });
    } finally {
      setIsAddingBeadle(false);
    }
  };

  const handleRemoveBeadle = async (studentId: string) => {
    if (!user) {
      console.log("handleRemoveBeadle: missing user");
      return;
    }

    setIsRemovingBeadle(studentId);
    try {
      console.log("Removing beadle:", { classId, studentId, teacherId: user.userId });
      await removeBeadleMutation({
        classId: classId as Id<"classes">,
        studentId: studentId as Id<"users">,
        teacherId: user.userId as Id<"users">,
      });
      toast({
        title: "Beadle Removed",
        description: "Student has been removed as a class beadle.",
      });
    } catch (error) {
      console.error("Failed to remove beadle:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove beadle",
        variant: "destructive",
      });
    } finally {
      setIsRemovingBeadle(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await updateSettings({
        classId: classId as Id<"classes">,
        teacherId: user.userId as Id<"users">,
        name: settings.className,
        description: settings.description || undefined,
        autoMarkAbsent: settings.autoMarkAbsent,
        allowLateSubmissions: settings.allowLateSubmissions,
        sendReminders: settings.sendReminders,
        requireConfirmation: settings.requireConfirmation,
      });
      toast({
        title: "Settings Updated",
        description: "Class settings have been saved successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = classSettings === undefined || beadles === undefined || availableStudents === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Class Settings</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  value={settings.className}
                  onChange={(e) => setSettings(prev => ({ ...prev, className: e.target.value }))}
                  required
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
                {beadles && beadles.length > 0 ? (
                  beadles.map((beadle) => (
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
                        disabled={isRemovingBeadle === beadle.id}
                      >
                        {isRemovingBeadle === beadle.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No beadles assigned yet.</p>
                )}

                {availableStudents && availableStudents.length > 0 && (
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
                      disabled={!selectedStudent || isAddingBeadle}
                    >
                      {isAddingBeadle ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
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
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};