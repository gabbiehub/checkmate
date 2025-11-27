import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, UserCheck, Lock, Unlock, Settings, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AttendanceStatus = "present" | "late" | "absent" | "excused" | "unmarked";

type DisplayMode = 
  | "full-name" 
  | "first-name" 
  | "last-name" 
  | "student-id";

interface Seat {
  id: string;
  studentName?: string;
  studentId?: string;
  studentIdNumber?: string;
  status: AttendanceStatus;
  row: number;
  col: number;
  userId?: Id<"users">;
}

interface SeatingChartProps {
  classId: Id<"classes">;
}

export const SeatingChart = ({ classId }: SeatingChartProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full-name");
  const [attendanceMode, setAttendanceMode] = useState(false);

  const todayDate = format(new Date(), 'yyyy-MM-dd');

  // Fetch seating chart data
  const seatingData = useQuery(api.classes.getSeatingChart, { classId });
  const classStudents = useQuery(api.classes.getClassStudents, { classId });
  const todayAttendance = useQuery(api.classes.getTodayAttendance, { 
    classId,
    date: todayDate 
  });
  
  const finalizeSeating = useMutation(api.classes.finalizeSeating);
  const unfinalizeSeating = useMutation(api.classes.unfinalizeSeating);
  const markAttendance = useMutation(api.classes.markAttendance);

  if (!user || !seatingData || !classStudents) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading seating chart...</p>
        </Card>
      </div>
    );
  }

  const { rows, cols, finalized, seats: assignments } = seatingData;

  // Get attendance status for each student
  const getStudentAttendanceStatus = (studentId?: Id<"users">): AttendanceStatus => {
    if (!studentId || !todayAttendance) return "unmarked";
    
    const record = todayAttendance.records.find(r => r.studentId === studentId);
    if (record) {
      return record.status as AttendanceStatus;
    }
    return "unmarked";
  };

  // Create seat grid with attendance status
  const seats: Seat[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const assignment = assignments.find(a => a.row === row && a.col === col);
      seats.push({
        id: `${row}-${col}`,
        studentName: assignment?.studentName,
        studentId: assignment?.studentId,
        studentIdNumber: assignment?.studentIdNumber,
        status: assignment ? getStudentAttendanceStatus(assignment.studentId) : "unmarked",
        row,
        col,
        userId: assignment?.studentId,
      });
    }
  }

  const handleFinalize = async () => {
    if (!user) return;
    
    try {
      if (finalized) {
        await unfinalizeSeating({ classId, teacherId: user.userId });
        toast({
          title: "Seating Unlocked",
          description: "Students can now change their seats.",
        });
      } else {
        await finalizeSeating({ classId, teacherId: user.userId });
        toast({
          title: "Seating Finalized",
          description: "Students can no longer change their seats.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update seating status",
        variant: "destructive",
      });
    }
  };

  const handleMarkAttendance = async (
    studentId: Id<"users">, 
    status: "present" | "late" | "absent" | "excused",
    studentName?: string
  ) => {
    if (!user) return;
    
    console.log("Marking attendance:", { studentId, status, studentName });
    
    try {
      await markAttendance({
        classId,
        studentId,
        date: todayDate,
        status,
        teacherId: user.userId,
      });
      
      toast({
        title: "Attendance Marked",
        description: `${studentName || "Student"} marked as ${status}`,
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const getSeatColor = (status: AttendanceStatus, hasStudent: boolean) => {
    if (!hasStudent) return "bg-muted border-border opacity-30";
    
    if (!attendanceMode) {
      return "bg-blue-100 border-blue-300 hover:bg-blue-200";
    }
    
    switch (status) {
      case "present":
        return "bg-green-100 border-green-400";
      case "late":
        return "bg-yellow-100 border-yellow-400";
      case "absent":
        return "bg-red-100 border-red-400";
      case "excused":
        return "bg-blue-100 border-blue-400";
      case "unmarked":
        return "bg-gray-100 border-gray-400";
    }
  };

  const getSeatIcon = (status: AttendanceStatus, hasStudent: boolean) => {
    if (!hasStudent) return <div className="w-3 h-3" />;
    
    if (!attendanceMode) {
      return <User className="w-3 h-3 text-muted-foreground" />;
    }
    
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "late":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "excused":
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case "unmarked":
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const statusCounts = seats.reduce((acc, seat) => {
    if (seat.studentName) {
      acc[seat.status]++;
    } else {
      acc.empty++;
    }
    return acc;
  }, { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0, empty: 0 } as Record<AttendanceStatus | 'empty', number>);

  const renderSeatContent = (seat: Seat) => {
    if (!seat.studentName) return null;

    const [firstName, ...lastNameParts] = seat.studentName.split(' ');
    const lastName = lastNameParts.join(' ');

    switch (displayMode) {
      case "first-name":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="font-medium truncate w-full text-xs">{firstName}</div>
          </div>
        );
      case "last-name":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="font-medium truncate w-full text-xs">{lastName}</div>
          </div>
        );
      case "student-id":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="font-medium truncate w-full text-xs">{seat.studentIdNumber}</div>
          </div>
        );
      case "full-name":
      default:
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="font-medium truncate w-full text-xs">{firstName}</div>
            <div className="text-xs text-muted-foreground truncate w-full">{lastName}</div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">View Mode</h4>
            <p className="text-sm text-muted-foreground">
              {attendanceMode ? "Click seats to mark attendance" : "Viewing seat assignments"}
            </p>
          </div>
          <Button 
            variant={attendanceMode ? "default" : "outline"}
            onClick={() => setAttendanceMode(!attendanceMode)}
          >
            {attendanceMode ? (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Attendance Mode
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Seating Mode
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Finalization Controls - Only show in seating mode */}
      {!attendanceMode && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {finalized ? (
                <>
                  <Lock className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">Seating Finalized</h4>
                    <p className="text-sm text-muted-foreground">Students cannot change seats</p>
                  </div>
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-foreground">Seating Open</h4>
                    <p className="text-sm text-muted-foreground">Students can choose seats</p>
                  </div>
                </>
              )}
            </div>
            <Button 
              variant={finalized ? "outline" : "default"}
              onClick={handleFinalize}
            >
              {finalized ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock Seating
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Finalize Seating
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Display Mode Selector - Only show in seating mode */}
      {!attendanceMode && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium text-foreground">Display Options</h4>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Seat Display Mode:</label>
            <Select value={displayMode} onValueChange={(value: DisplayMode) => setDisplayMode(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-name">Full Name</SelectItem>
                <SelectItem value="first-name">First Name Only</SelectItem>
                <SelectItem value="last-name">Last Name Only</SelectItem>
                <SelectItem value="student-id">Student ID Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">
            {attendanceMode ? "Attendance Statistics" : "Seating Statistics"}
          </h4>
        </div>
        <div className="flex gap-2 text-xs flex-wrap">
          {attendanceMode ? (
            <>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Present: {statusCounts.present}
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                Late: {statusCounts.late}
              </Badge>
              <Badge variant="outline" className="bg-red-100 text-red-700">
                Absent: {statusCounts.absent}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Excused: {statusCounts.excused}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                Unmarked: {statusCounts.unmarked}
              </Badge>
            </>
          ) : (
            <>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Assigned: {rows * cols - statusCounts.empty}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                Empty: {statusCounts.empty}
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                Total Seats: {rows * cols}
              </Badge>
            </>
          )}
        </div>
      </Card>

      {/* Seating Chart */}
      <Card className="p-4 overflow-x-auto">
        <div className="mb-4 text-center">
          <div className="inline-block px-8 py-2 bg-muted rounded-lg text-sm font-medium text-muted-foreground">
            📚 Teacher's Desk / Whiteboard
          </div>
        </div>
        
        <div className={`grid gap-2 min-w-fit mx-auto`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {seats.map((seat) => {
            const hasStudent = !!seat.studentName;
            
            return attendanceMode && hasStudent && seat.userId ? (
              // Interactive seat in attendance mode
              <DropdownMenu key={seat.id}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "h-16 w-16 p-1 flex flex-col items-center justify-center text-xs border-2 transition-all rounded-md cursor-pointer hover:scale-105 hover:shadow-md active:scale-95",
                      getSeatColor(seat.status, hasStudent),
                    )}
                    onClick={() => console.log("Seat clicked:", seat.studentName, seat.userId)}
                  >
                    {getSeatIcon(seat.status, hasStudent)}
                    {renderSeatContent(seat)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleMarkAttendance(seat.userId!, "present", seat.studentName)}>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Mark Present
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkAttendance(seat.userId!, "late", seat.studentName)}>
                    <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                    Mark Late
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkAttendance(seat.userId!, "absent", seat.studentName)}>
                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                    Mark Absent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkAttendance(seat.userId!, "excused", seat.studentName)}>
                    <UserCheck className="w-4 h-4 mr-2 text-blue-600" />
                    Mark Excused
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Non-interactive seat in seating mode or empty seat
              <div
                key={seat.id}
                className={cn(
                  "h-16 w-16 p-1 flex flex-col items-center justify-center text-xs border-2 transition-all rounded-md",
                  getSeatColor(seat.status, hasStudent),
                )}
              >
                {getSeatIcon(seat.status, hasStudent)}
                {renderSeatContent(seat)}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          {attendanceMode 
            ? "Click on a student's seat to mark their attendance" 
            : finalized 
            ? "Seating arrangement is finalized" 
            : "Students can select their seats"}
        </div>
      </Card>

      {/* Student List */}
      <Card className="p-4">
        <h4 className="font-medium text-foreground mb-3">Students Without Seats</h4>
        <div className="space-y-2">
          {classStudents
            .filter(student => !student.seatAssignment)
            .map(student => (
              <div key={student._id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div>
                  <p className="font-medium text-sm">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.idNumber || 'No ID'}</p>
                </div>
                <Badge variant="outline">No Seat</Badge>
              </div>
            ))}
          {classStudents.filter(s => !s.seatAssignment).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">All students have seats assigned</p>
          )}
        </div>
      </Card>
    </div>
  );
};
