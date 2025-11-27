import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Users, 
  QrCode, 
  Settings, 
  Calendar, 
  Bell,
  BarChart3,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { SeatingChart } from "./SeatingChart";
import { StudentList } from "./StudentList";
import { ClassAnalytics } from "./ClassAnalytics";
import { ClassSettingsDialog } from "./ClassSettingsDialog";
import { QRCodeDialog } from "./QRCodeDialog";
import { AddReminderDialog } from "./AddReminderDialog";
import { AddEventDialog } from "./AddEventDialog";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ClassViewProps {
  classId: string;
  onBack: () => void;
}

export const ClassView = ({ classId, onBack }: ClassViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("attendance");
  const [showSettings, setShowSettings] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  
  // Fetch real class data
  const classData = useQuery(api.classes.getClass, { classId: classId as Id<"classes"> });
  
  // Fetch today's attendance
  const todayAttendance = useQuery(api.classes.getTodayAttendance, { 
    classId: classId as Id<"classes">,
    date: todayDate 
  });
  
  // Mutations
  const markAttendance = useMutation(api.classes.markAttendance);
  const markAllAttendance = useMutation(api.classes.markAllAttendance);
  
  if (!classData || !user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading class...</p>
      </div>
    );
  }

  const todayStats = todayAttendance?.stats || {
    total: classData.studentCount || 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    unmarked: classData.studentCount || 0,
  };

  const handleMarkAll = async (status: "present" | "absent" | "late" | "excused") => {
    setIsMarkingAll(true);
    try {
      const result = await markAllAttendance({
        classId: classId as Id<"classes">,
        date: todayDate,
        status,
        teacherId: user.userId,
      });
      
      toast({
        title: "Attendance Marked",
        description: `Marked ${result.count} students as ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark attendance",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkStudent = async (
    studentId: string, 
    status: "present" | "absent" | "late" | "excused"
  ) => {
    try {
      await markAttendance({
        classId: classId as Id<"classes">,
        studentId: studentId as Id<"users">,
        date: todayDate,
        status,
        teacherId: user.userId,
      });
      
      toast({
        title: "Attendance Updated",
        description: `Student marked as ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/10 p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{classData.name}</h1>
            <p className="text-primary-foreground/80 text-sm">
              {classData.code} {classData.description ? `• ${classData.description}` : ''}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-white/10 p-2"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Today's Attendance Summary */}
        <Card className="bg-white/10 border-white/20 text-primary-foreground">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Today's Attendance</h3>
              <Clock className="w-4 h-4" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{todayStats.total}</div>
                <div className="text-xs text-primary-foreground/70">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-300">{todayStats.present}</div>
                <div className="text-xs text-primary-foreground/70">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{todayStats.late}</div>
                <div className="text-xs text-primary-foreground/70">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-300">{todayStats.absent}</div>
                <div className="text-xs text-primary-foreground/70">Absent</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="bg-card shadow-card hover:shadow-soft"
            onClick={() => setShowQRCode(true)}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Class Code
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowAddEvent(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Add Event
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowAddReminder(true)}
            className="col-span-2"
          >
            <Bell className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full bg-muted">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="seating">Seating</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Mark Attendance - {format(new Date(), 'MMM dd, yyyy')}</h3>
            </div>

            {/* Quick Mark All Buttons */}
            <Card className="p-4">
              <h4 className="font-medium mb-3 text-sm">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("present")}
                  disabled={isMarkingAll}
                  className="border-green-200 hover:bg-green-50"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  )}
                  All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("absent")}
                  disabled={isMarkingAll}
                  className="border-red-200 hover:bg-red-50"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1 text-red-600" />
                  )}
                  All Absent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("late")}
                  disabled={isMarkingAll}
                  className="border-yellow-200 hover:bg-yellow-50"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-1 text-yellow-600" />
                  )}
                  All Late
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("excused")}
                  disabled={isMarkingAll}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-1 text-blue-600" />
                  )}
                  All Excused
                </Button>
              </div>
            </Card>

            {/* Student List for Attendance */}
            <Card className="p-4">
              <div className="space-y-2">
                {todayAttendance?.records.map((record) => (
                  <div
                    key={record._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{record.studentName}</p>
                      {record.studentIdNumber && (
                        <p className="text-xs text-muted-foreground">{record.studentIdNumber}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={record.status === "present" ? "default" : "outline"}
                        onClick={() => handleMarkStudent(record.studentId, "present")}
                        className={record.status === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={record.status === "late" ? "default" : "outline"}
                        onClick={() => handleMarkStudent(record.studentId, "late")}
                        className={record.status === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                      >
                        <Clock className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={record.status === "absent" ? "default" : "outline"}
                        onClick={() => handleMarkStudent(record.studentId, "absent")}
                        className={record.status === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={record.status === "excused" ? "default" : "outline"}
                        onClick={() => handleMarkStudent(record.studentId, "excused")}
                        className={record.status === "excused" ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        <UserCheck className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {todayAttendance?.unmarked.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{student.studentName}</p>
                      {student.studentIdNumber && (
                        <p className="text-xs text-muted-foreground">{student.studentIdNumber}</p>
                      )}
                      <Badge variant="outline" className="mt-1 text-xs">Not marked</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkStudent(student.studentId, "present")}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkStudent(student.studentId, "late")}
                      >
                        <Clock className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkStudent(student.studentId, "absent")}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkStudent(student.studentId, "excused")}
                      >
                        <UserCheck className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="seating" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Classroom Layout</h3>
            </div>
            <SeatingChart classId={classId as Id<"classes">} />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Student List</h3>
              <Badge variant="outline">
                {classData.studentCount || 0} students
              </Badge>
            </div>
            <StudentList classId={classId as Id<"classes">} />
          </TabsContent>
        </Tabs>
      </div>
      
      <ClassSettingsDialog 
        open={showSettings}
        onOpenChange={setShowSettings}
        classId={classId}
      />
      <QRCodeDialog 
        open={showQRCode}
        onOpenChange={setShowQRCode}
        classData={{ name: classData.name, code: classData.code }}
      />
      <AddReminderDialog 
        open={showAddReminder} 
        onOpenChange={setShowAddReminder}
      />
      <AddEventDialog 
        open={showAddEvent} 
        onOpenChange={setShowAddEvent}
      />
    </div>
  );
};