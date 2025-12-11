import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, TrendingUp, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Armchair, User, Bell, UserCheck, Loader2, BarChart3 } from "lucide-react";
import { BeadleAnalyticsDashboard } from "./BeadleAnalyticsDashboard";
import { StudentSeatingChart } from "./StudentSeatingChart";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

interface StudentClassViewProps {
  classId: string;
  onBack: () => void;
}

export const StudentClassView = ({ classId, onBack }: StudentClassViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const todayDate = format(new Date(), 'yyyy-MM-dd');

  // Fetch real data from Convex
  const classData = useQuery(api.classes.getClass, { classId: classId as Id<"classes"> });
  const seatingData = useQuery(api.classes.getSeatingChart, { classId: classId as Id<"classes"> });
  const classStudents = useQuery(api.classes.getClassStudents, { classId: classId as Id<"classes"> });
  const myAttendance = useQuery(api.classes.getStudentAttendance, { 
    classId: classId as Id<"classes">,
    studentId: user?.userId ?? ("" as Id<"users">)
  });
  const classStats = useQuery(api.classes.getClassAttendanceStats, { classId: classId as Id<"classes"> });
  
  // Check if user is a beadle
  const isBeadle = useQuery(api.classes.isUserBeadle, {
    classId: classId as Id<"classes">,
    userId: user?.userId ?? ("" as Id<"users">),
  });
  
  // Fetch today's attendance (for beadles)
  const todayAttendance = useQuery(
    api.classes.getTodayAttendance,
    isBeadle ? { classId: classId as Id<"classes">, date: todayDate } : "skip"
  );
  
  // Fetch reminders for this class
  const allReminders = useQuery(
    api.eventsAndReminders.getUserReminders,
    user ? { userId: user.userId } : "skip"
  );
  
  // Filter reminders related to this class
  const classReminders = allReminders?.filter(r => {
    const isClassWide = (r as any).isClassWide;
    const reminderClassId = (r as any).classId;
    return isClassWide && reminderClassId === classId;
  }).filter(r => !r.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate)) || [];
  
  const assignSeat = useMutation(api.classes.assignSeat);
  const markAttendance = useMutation(api.classes.markAttendance);
  const markAllAttendance = useMutation(api.classes.markAllAttendance);

  if (!user || !classData || !seatingData || !classStudents || !myAttendance || !classStats) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading class...</p>
      </div>
    );
  }

  // Find student's seat assignment
  const mySeat = seatingData.seats.find(s => s.studentId === user.userId);
  const mySeatPosition = mySeat ? { row: mySeat.row, col: mySeat.col } : null;

  // Handle seat selection
  const handleSeatSelect = async (row: number, col: number) => {
    if (!user || seatingData.finalized) return;

    try {
      await assignSeat({
        classId: classId as Id<"classes">,
        studentId: user.userId,
        row,
        col,
      });

      toast({
        title: "Seat Selected!",
        description: `You've been assigned to Row ${row + 1}, Column ${col + 1}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to select seat",
        variant: "destructive",
      });
    }
  };

  // Beadle attendance marking handlers
  const handleMarkAll = async (status: "present" | "absent" | "late" | "excused") => {
    if (!user || !isBeadle) return;
    
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
    if (!user || !isBeadle) return;
    
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

  const todayStats = todayAttendance?.stats || {
    total: classData.studentCount || 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    unmarked: classData.studentCount || 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "late":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "absent":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200";
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "absent":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{classData.description || classData.name}</h1>
            <p className="text-sm text-muted-foreground">
              {classData.name}{classData.schedule && ` • ${classData.schedule}`}
            </p>
          </div>
          <Badge variant="outline">{classData.studentCount} students</Badge>
        </div>
      </div>

      <div className="p-4">
        {/* Class Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{classData.studentCount} Students</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Enrolled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Attendance Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              My Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted-foreground">Attendance Rate</span>
              <span className="text-2xl font-bold text-primary">{myAttendance.attendanceRate}%</span>
            </div>
            <Progress value={myAttendance.attendanceRate} className="mb-4" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-green-600">{myAttendance.stats.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-yellow-600">{myAttendance.stats.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-red-600">{myAttendance.stats.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Beadle Badge */}
        {isBeadle && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">Class Beadle</p>
                  <p className="text-sm text-amber-700">You can mark attendance for this class</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={cn("grid w-full", isBeadle ? "grid-cols-5" : "grid-cols-3")}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {isBeadle && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
            {isBeadle && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
            <TabsTrigger value="seating">My Seat</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Beadle Attendance Tab */}
          {isBeadle && (
            <TabsContent value="attendance" className="space-y-4">
              {/* Today's Attendance Summary */}
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Clock className="w-5 h-5" />
                    Today's Attendance - {format(new Date(), 'MMM dd, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700">{todayStats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{todayStats.present}</div>
                      <div className="text-xs text-muted-foreground">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{todayStats.late}</div>
                      <div className="text-xs text-muted-foreground">Late</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{todayStats.absent}</div>
                      <div className="text-xs text-muted-foreground">Absent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Mark All Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Student List for Attendance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Mark Individual Students</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                  {todayAttendance?.records.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{record.studentName}</p>
                        {record.studentIdNumber && (
                          <p className="text-xs text-muted-foreground">{record.studentIdNumber}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={record.status === "present" ? "default" : "outline"}
                          onClick={() => handleMarkStudent(record.studentId, "present")}
                          className={cn("h-8 w-8 p-0", record.status === "present" && "bg-green-600 hover:bg-green-700")}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={record.status === "late" ? "default" : "outline"}
                          onClick={() => handleMarkStudent(record.studentId, "late")}
                          className={cn("h-8 w-8 p-0", record.status === "late" && "bg-yellow-600 hover:bg-yellow-700")}
                        >
                          <Clock className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={record.status === "absent" ? "default" : "outline"}
                          onClick={() => handleMarkStudent(record.studentId, "absent")}
                          className={cn("h-8 w-8 p-0", record.status === "absent" && "bg-red-600 hover:bg-red-700")}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={record.status === "excused" ? "default" : "outline"}
                          onClick={() => handleMarkStudent(record.studentId, "excused")}
                          className={cn("h-8 w-8 p-0", record.status === "excused" && "bg-blue-600 hover:bg-blue-700")}
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
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.studentName}</p>
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
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkStudent(student.studentId, "late")}
                          className="h-8 w-8 p-0"
                        >
                          <Clock className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkStudent(student.studentId, "absent")}
                          className="h-8 w-8 p-0"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkStudent(student.studentId, "excused")}
                          className="h-8 w-8 p-0"
                        >
                          <UserCheck className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Beadle Analytics Tab */}
          {isBeadle && (
            <TabsContent value="analytics" className="space-y-4">
              <BeadleAnalyticsDashboard classId={classId as Id<"classes">} />
            </TabsContent>
          )}
          
          <TabsContent value="overview" className="space-y-4">
            {/* Class Reminders from Teacher */}
            {classReminders.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Bell className="w-5 h-5" />
                    Class Reminders
                  </CardTitle>
                  <CardDescription>
                    Important reminders from your teacher
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {classReminders.map((reminder) => {
                    const isOverdue = new Date(reminder.dueDate) < new Date();
                    
                    return (
                      <div 
                        key={reminder._id}
                        className={`p-3 rounded-lg border ${
                          isOverdue ? 'bg-red-50 border-red-200' : 'bg-background'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-sm">{reminder.title}</h4>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {reminder.description.split('\n')[0]}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Due: {format(new Date(reminder.dueDate), "MMM dd, yyyy")} • {formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* My Classmates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  My Classmates
                </CardTitle>
                <CardDescription>
                  {classStudents.length} {classStudents.length === 1 ? 'student' : 'students'} enrolled in this class
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {classStudents.map((student) => {
                  const isMe = student._id === user.userId;
                  return (
                    <div 
                      key={student._id} 
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-lg",
                        isMe && "bg-primary/5 border-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {student.name} {isMe && "(You)"}
                          </p>
                          {student.idNumber && (
                            <p className="text-xs text-muted-foreground">{student.idNumber}</p>
                          )}
                        </div>
                      </div>
                      {student.seatAssignment ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Armchair className="w-3 h-3" />
                          R{student.seatAssignment.row + 1}C{student.seatAssignment.col + 1}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No Seat</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Class Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Class Performance</CardTitle>
                <CardDescription>
                  Your performance compared to class average
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">My Attendance</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{myAttendance.attendanceRate}%</span>
                    {myAttendance.attendanceRate > classStats.averageAttendance ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        +{myAttendance.attendanceRate - classStats.averageAttendance}% above avg
                      </Badge>
                    ) : myAttendance.attendanceRate < classStats.averageAttendance ? (
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                        {myAttendance.attendanceRate - classStats.averageAttendance}% below avg
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">At average</Badge>
                    )}
                  </div>
                </div>
                <Progress value={myAttendance.attendanceRate} />
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Class Average</span>
                    <span className="font-medium">{classStats.averageAttendance}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span className="font-medium">{myAttendance.stats.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="seating" className="space-y-4">
            {/* My Seat Info */}
            {mySeatPosition ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Armchair className="w-5 h-5" />
                    My Assigned Seat
                  </CardTitle>
                  <CardDescription>
                    Your seat location in the classroom
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-primary/5 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Row</p>
                      <p className="text-2xl font-bold text-primary">{mySeatPosition.row + 1}</p>
                    </div>
                    <div className="text-center p-3 bg-primary/5 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Column</p>
                      <p className="text-2xl font-bold text-primary">{mySeatPosition.col + 1}</p>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-accent/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Your seat is highlighted in the seating chart below</p>
                    <Badge className="mt-2 bg-primary text-primary-foreground">
                      Row {mySeatPosition.row + 1}, Column {mySeatPosition.col + 1}
                    </Badge>
                  </div>
                  {!seatingData.finalized && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        toast({
                          title: "Change Seat",
                          description: "Click on an empty seat in the chart below to change your seat",
                        });
                      }}
                    >
                      Change Seat
                    </Button>
                  )}
                  {seatingData.finalized && (
                    <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">🔒 Seating has been finalized by the teacher</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Armchair className="w-5 h-5" />
                    Select Your Seat
                  </CardTitle>
                  <CardDescription>
                    {seatingData.finalized 
                      ? "Seating has been finalized. Contact your teacher for seat assignment."
                      : "Choose an available seat from the chart below"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!seatingData.finalized ? (
                    <div className="text-center p-4 bg-accent/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Click on any empty seat (gray) in the chart below to claim it
                      </p>
                      <Badge variant="outline">Available seats are shown in gray</Badge>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        🔒 Seating arrangement has been finalized
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Classroom Seating Chart */}
            <StudentSeatingChart 
              classId={classId as Id<"classes">}
              studentId={user.userId}
              onSeatSelect={handleSeatSelect}
              canSelectSeat={!seatingData.finalized}
            />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  Your recent attendance records ({myAttendance.records.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {myAttendance.records.length > 0 ? (
                  myAttendance.records.slice(0, 10).map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-medium">
                            {new Date(record.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.notes || `Marked as ${record.status}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={`capitalize ${getStatusColor(record.status)}`}>
                        {record.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No attendance records yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your attendance will be tracked here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};