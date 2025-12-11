import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Check,
  Clock,
  X,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useOfflineAttendance,
  formatAttendanceDate,
  getReadableDate,
  AttendanceStatus,
} from "@/hooks/use-offline-attendance";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceViewProps {
  classId: Id<"classes">;
}

// Seat type from seatingChart query
interface SeatAssignment {
  studentId: Id<"users">;
  studentName: string;
  studentIdNumber?: string;
  row: number;
  col: number;
}

interface Seat {
  row: number;
  col: number;
  studentId?: Id<"users">;
  studentName?: string;
  studentIdNumber?: string;
}

// Status configuration with colors and icons
const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
  }
> = {
  present: {
    label: "Present",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-500",
    icon: Check,
  },
  late: {
    label: "Late",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-500",
    icon: Clock,
  },
  absent: {
    label: "Absent",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    borderColor: "border-red-500",
    icon: X,
  },
  excused: {
    label: "Excused",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-500",
    icon: AlertCircle,
  },
};

// Default tap cycle order
const TAP_CYCLE: AttendanceStatus[] = ["present", "late", "absent"];

export const AttendanceView = ({ classId }: AttendanceViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(formatAttendanceDate());
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>("present");
  // Convex queries
  const seatingData = useQuery(api.classes.getSeatingChart, { classId });
  const attendanceMap = useQuery(api.attendance.getAttendanceStatusMap, {
    classId,
    date: selectedDate,
  });
  const sessions = useQuery(api.attendance.getClassSessions, { classId });

  // Convex mutations
  const markStudentMutation = useMutation(api.attendance.markStudent);
  const syncOfflineAction = useAction(api.attendance.syncOfflineRecords);

  // Offline attendance hook
  const {
    isOnline,
    pendingRecords,
    pendingCount,
    localAttendance,
    isSyncing,
    setIsSyncing,
    queueAttendanceMark,
    markAsSynced,
    getLocalStatus,
    hasPendingRecord,
  } = useOfflineAttendance({
    classId,
    date: selectedDate,
  });

  // Sync offline records when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing && user) {
      syncPendingRecords();
    }
  }, [isOnline, pendingCount, user]);

  const syncPendingRecords = async () => {
    if (!user || pendingRecords.length === 0) return;

    setIsSyncing(true);
    try {
      const recordsToSync = pendingRecords.map((r) => ({
        classId: r.classId,
        studentId: r.studentId,
        date: r.date,
        status: r.status,
        timestamp: r.timestamp,
        notes: r.notes,
      }));

      const result = await syncOfflineAction({
        records: recordsToSync,
        markedBy: user.userId,
      });

      if (result.synced > 0) {
        // Mark successful records as synced
        const syncedIds = result.results
          .filter((r) => r.success)
          .map((r) => r.studentId);
        markAsSynced(syncedIds);

        toast({
          title: "Sync Complete",
          description: `${result.synced} attendance records synced successfully.${
            result.failed > 0 ? ` ${result.failed} failed.` : ""
          }`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync offline records",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle one-tap attendance marking
  const handleSeatTap = useCallback(
    async (studentId: Id<"users">, studentName?: string) => {
      if (!user) return;

      // Determine the next status based on current status
      const currentStatus =
        getLocalStatus(studentId) ||
        attendanceMap?.[studentId]?.status ||
        null;

      // Cycle through statuses or use selected status
      let newStatus: AttendanceStatus;
      if (currentStatus) {
        const currentIndex = TAP_CYCLE.indexOf(currentStatus);
        if (currentIndex >= 0) {
          newStatus = TAP_CYCLE[(currentIndex + 1) % TAP_CYCLE.length];
        } else {
          newStatus = selectedStatus;
        }
      } else {
        newStatus = selectedStatus;
      }

      if (isOnline) {
        // Mark attendance online
        try {
          await markStudentMutation({
            classId,
            studentId,
            date: selectedDate,
            status: newStatus,
            markedBy: user.userId,
          });

          toast({
            title: "Attendance Marked",
            description: `${studentName || "Student"} marked as ${STATUS_CONFIG[newStatus].label}`,
            duration: 2000,
          });
        } catch (error: any) {
          // If online mutation fails, queue for offline
          queueAttendanceMark(studentId, newStatus);
          toast({
            title: "Queued Offline",
            description: "Will sync when connection is restored",
            variant: "destructive",
          });
        }
      } else {
        // Queue attendance for offline sync
        queueAttendanceMark(studentId, newStatus);
        toast({
          title: "Saved Offline",
          description: `${studentName || "Student"} marked as ${STATUS_CONFIG[newStatus].label} (offline)`,
          duration: 2000,
        });
      }
    },
    [
      user,
      classId,
      selectedDate,
      selectedStatus,
      isOnline,
      attendanceMap,
      getLocalStatus,
      markStudentMutation,
      queueAttendanceMark,
      toast,
    ]
  );

  // Get effective status for a student (combines server and local state)
  const getEffectiveStatus = (studentId: Id<"users">): AttendanceStatus | null => {
    // Local/pending status takes precedence
    const localStatus = getLocalStatus(studentId);
    if (localStatus) return localStatus;
    
    // Fall back to server status
    return attendanceMap?.[studentId]?.status || null;
  };

  // Navigate between dates
  const navigateDate = (direction: "prev" | "next") => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(formatAttendanceDate(current));
  };

  const goToToday = () => {
    setSelectedDate(formatAttendanceDate());
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  // Calculate stats
  const stats = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    unmarked: 0,
    total: 0,
  };
  
  // Get all seats with students from the seating chart
  const seatsWithStudents = seatingData?.seats || [];
  stats.total = seatsWithStudents.length;

  seatsWithStudents.forEach((seat) => {
    const status = getEffectiveStatus(seat.studentId);
    if (status) {
      stats[status]++;
    } else {
      stats.unmarked++;
    }
  });

  const isToday = selectedDate === formatAttendanceDate();

  return (
    <div className="space-y-4">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Take Attendance</h3>
          {/* Online/Offline indicator */}
          <Badge
            variant={isOnline ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {/* Sync button */}
        {pendingCount > 0 && isOnline && (
          <Button
            variant="outline"
            size="sm"
            onClick={syncPendingRecords}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        )}
      </div>

      {/* Date Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{getReadableDate(selectedDate)}</span>
              {isToday && (
                <Badge variant="secondary" className="text-xs">
                  Today
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate("next")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <Button variant="outline" size="sm" onClick={goToToday}>
                Go to Today
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Default:</span>
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v as AttendanceStatus)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn("w-3 h-3", config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Present: {stats.present}
        </Badge>
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          Late: {stats.late}
        </Badge>
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Absent: {stats.absent}
        </Badge>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          Excused: {stats.excused}
        </Badge>
        {stats.unmarked > 0 && (
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            Unmarked: {stats.unmarked}
          </Badge>
        )}
      </div>      {/* Seat Plan Attendance Grid */}
      <Card className="p-4">
        {seatingData ? (
          <>
            {/* Teacher's Desk */}
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 border-2 border-dashed border-primary/30 rounded-lg px-6 py-2">
                <span className="text-sm font-medium text-primary">Teacher's Desk</span>
              </div>
            </div>

            {/* Create seat grid from seating data */}
            {(() => {
              // Create a map of assignments by position
              const assignmentMap = new Map<string, SeatAssignment>();
              seatingData.seats.forEach((seat) => {
                assignmentMap.set(`${seat.row}-${seat.col}`, seat);
              });

              // Generate all seats in the grid
              const allSeats: Seat[] = [];
              for (let row = 0; row < seatingData.rows; row++) {
                for (let col = 0; col < seatingData.cols; col++) {
                  const assignment = assignmentMap.get(`${row}-${col}`);
                  allSeats.push({
                    row,
                    col,
                    studentId: assignment?.studentId,
                    studentName: assignment?.studentName,
                    studentIdNumber: assignment?.studentIdNumber,
                  });
                }
              }

              return (
                <div
                  className="grid gap-2 justify-center"
                  style={{
                    gridTemplateColumns: `repeat(${seatingData.cols}, minmax(0, 1fr))`,
                    maxWidth: `${seatingData.cols * 80}px`,
                    margin: "0 auto",
                  }}
                >
                  {allSeats.map((seat) => {
                    const status = seat.studentId
                      ? getEffectiveStatus(seat.studentId)
                      : null;
                    const isPending = seat.studentId
                      ? hasPendingRecord(seat.studentId)
                      : false;
                    const statusConfig = status ? STATUS_CONFIG[status] : null;
                    const seatLabel = `${String.fromCharCode(65 + seat.row)}${seat.col + 1}`;

                    return (
                      <TooltipProvider key={`${seat.row}-${seat.col}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                seat.studentId &&
                                handleSeatTap(seat.studentId, seat.studentName)
                              }
                              disabled={!seat.studentId}
                              className={cn(
                                "relative w-18 h-18 rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                                "focus:outline-none focus:ring-2 focus:ring-primary",
                                seat.studentId
                                  ? cn(
                                      "cursor-pointer active:scale-95",
                                      statusConfig
                                        ? cn(
                                            statusConfig.bgColor,
                                            "border-2",
                                            statusConfig.borderColor
                                          )
                                        : "bg-background border-2 border-border hover:border-primary/50"
                                    )
                                  : "bg-muted/20 border border-border cursor-not-allowed opacity-50"
                              )}
                              style={{ width: "72px", height: "72px" }}
                            >
                              {seat.studentId ? (
                                <>
                                  <Avatar className="h-8 w-8 mb-1">
                                    <AvatarFallback
                                      className={cn(
                                        "text-[10px]",
                                        statusConfig
                                          ? statusConfig.bgColor
                                          : "bg-primary/10"
                                      )}
                                    >
                                      {getInitials(seat.studentName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-[9px] text-muted-foreground truncate max-w-full px-1">
                                    {seat.studentName?.split(" ")[0]}
                                  </span>
                                  {/* Status indicator */}
                                  {status && statusConfig && (
                                    <div
                                      className={cn(
                                        "absolute top-1 right-1 rounded-full p-0.5",
                                        statusConfig.bgColor
                                      )}
                                    >
                                      <statusConfig.icon
                                        className={cn("w-3 h-3", statusConfig.color)}
                                      />
                                    </div>
                                  )}
                                  {/* Pending indicator */}
                                  {isPending && (
                                    <div className="absolute bottom-1 right-1">
                                      <RefreshCw className="w-2.5 h-2.5 text-orange-500 animate-pulse" />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="font-medium text-muted-foreground">
                                  {seatLabel}
                                </span>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {seat.studentId ? (
                              <div className="text-center">
                                <p className="font-medium">{seat.studentName}</p>
                                {seat.studentIdNumber && (
                                  <p className="text-xs text-muted-foreground">
                                    {seat.studentIdNumber}
                                  </p>
                                )}
                                <p className="text-xs mt-1">
                                  {status
                                    ? `Status: ${STATUS_CONFIG[status].label}`
                                    : "Tap to mark attendance"}
                                </p>
                                {isPending && (
                                  <p className="text-xs text-orange-500">
                                    Pending sync
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p>Empty seat: {seatLabel}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              );
            })()}            {/* Legend */}
            <div className="flex justify-center mt-4 space-x-4 text-xs text-muted-foreground flex-wrap gap-2">
              <span className="text-sm font-medium">Tap to cycle:</span>
              {TAP_CYCLE.map((status, index) => {
                const config = STATUS_CONFIG[status];
                return (
                  <span key={status} className="flex items-center gap-1">
                    <config.icon className={cn("w-3 h-3", config.color)} />
                    {config.label}
                    {index < TAP_CYCLE.length - 1 && " →"}
                  </span>
                );
              })}
            </div>
          </>
        ) : seatingData === undefined ? (
          <div className="text-center py-12 text-muted-foreground">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p className="text-lg font-medium">Loading Seating Chart...</p>
          </div>
        ) : seatingData.seats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Students Seated</p>
            <p className="text-sm mb-4">
              Students need to select their seats before you can take attendance.
            </p>
            <p className="text-xs">
              Go to the <strong>Seating</strong> tab to manage seat assignments.
            </p>
          </div>
        ) : null}
      </Card>

      {/* Attendance Tips */}
      <div className="bg-accent/50 rounded-lg p-3">
        <h5 className="font-medium text-sm text-foreground mb-2">
          Quick Tips:
        </h5>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>
            • <strong>One-tap</strong> to cycle through Present → Late → Absent
          </li>
          <li>
            • Use the <strong>Default</strong> selector to change the initial
            status
          </li>
          <li>
            • Works <strong>offline</strong> - records sync automatically when
            reconnected
          </li>
          <li>
            • <RefreshCw className="w-3 h-3 inline text-orange-500" /> icon
            indicates pending sync
          </li>
        </ul>
      </div>
    </div>
  );
};
