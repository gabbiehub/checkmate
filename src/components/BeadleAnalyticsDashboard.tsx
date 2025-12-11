import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  BarChart3,
  UserCheck,
  Flame,
  Target,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";

interface BeadleAnalyticsDashboardProps {
  classId: Id<"classes">;
}

type RiskLevel = "none" | "low" | "medium" | "high";

interface StudentAnalytics {
  studentId: Id<"users">;
  studentName: string;
  studentEmail?: string;
  studentIdNumber?: string;
  stats: {
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
  };
  attendanceRate: number;
  riskLevel: RiskLevel;
  recentTrend: number | null;
  currentStreak: number;
  lastAttendance: string | null;
}

const getRiskBadgeStyles = (risk: RiskLevel) => {
  switch (risk) {
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "low":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  }
};

const getRiskLabel = (risk: RiskLevel) => {
  switch (risk) {
    case "high":
      return "High Risk";
    case "medium":
      return "Medium Risk";
    case "low":
      return "Low Risk";
    default:
      return "Good Standing";
  }
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

const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
};

const formatShortDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return dateStr;
  }
};

export const BeadleAnalyticsDashboard = ({ classId }: BeadleAnalyticsDashboardProps) => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);
  const [sortBy, setSortBy] = useState<"rate" | "absences" | "name">("rate");

  // Fetch analytics data
  const analytics = useQuery(
    api.attendance.getClassAnalytics,
    user?.userId
      ? {
          classId,
          userId: user.userId,
        }
      : "skip"
  );

  // Fetch selected student's detailed history
  const studentHistory = useQuery(
    api.attendance.getStudentAttendanceHistory,
    selectedStudent && user?.userId
      ? {
          classId,
          studentId: selectedStudent.studentId,
          requestedBy: user.userId,
        }
      : "skip"
  );

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Sort students based on selected criteria
  const sortedStudents = [...analytics.studentAnalytics].sort((a, b) => {
    switch (sortBy) {
      case "rate":
        return a.attendanceRate - b.attendanceRate; // Worst first
      case "absences":
        return b.stats.absent - a.stats.absent; // Most absences first
      case "name":
        return a.studentName.localeCompare(b.studentName);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Attendance Analytics</h2>
          <p className="text-muted-foreground">
            {analytics.className} • {analytics.totalStudents} students • {analytics.totalSessions} sessions
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <RefreshCw className="w-3 h-3 mr-1" />
          Real-time
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Rate</span>
            {analytics.weeklyTrend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="text-3xl font-bold text-foreground">
            {analytics.overallPercentages.presentRate}%
          </div>
          <div
            className={cn(
              "text-xs mt-1",
              analytics.weeklyTrend >= 0 ? "text-green-600" : "text-red-600"
            )}
          >
            {analytics.weeklyTrend >= 0 ? "+" : ""}
            {analytics.weeklyTrend}% this week
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Today</span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {analytics.todayStats.attendanceRate}%
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {analytics.todayStats.total} marked / {analytics.totalStudents} total
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">At Risk</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {analytics.atRiskStudents.length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            students need attention
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Sessions</span>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {analytics.totalSessions}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            classes recorded
          </div>
        </Card>
      </div>

      {/* Today's Status */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Today's Attendance Summary
        </h3>
        <div className="grid grid-cols-5 gap-2">
          <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mb-1" />
            <span className="text-lg font-bold text-green-700 dark:text-green-400">
              {analytics.todayStats.present}
            </span>
            <span className="text-xs text-green-600 dark:text-green-500">Present</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mb-1" />
            <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
              {analytics.todayStats.late}
            </span>
            <span className="text-xs text-yellow-600 dark:text-yellow-500">Late</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mb-1" />
            <span className="text-lg font-bold text-red-700 dark:text-red-400">
              {analytics.todayStats.absent}
            </span>
            <span className="text-xs text-red-600 dark:text-red-500">Absent</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
            <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {analytics.todayStats.excused}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-500">Excused</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400 mb-1" />
            <span className="text-lg font-bold text-gray-700 dark:text-gray-400">
              {analytics.todayStats.unmarked}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-500">Unmarked</span>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="at-risk">At Risk</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Weekly Trend Chart */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Recent Sessions</h3>
            {analytics.dailyBreakdown.length > 0 ? (
              <div className="space-y-3">
                {analytics.dailyBreakdown.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-muted-foreground">
                      {formatShortDate(day.date)}
                    </div>
                    <div className="flex-1">
                      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                        {day.present > 0 && (
                          <div
                            className="bg-green-500 h-full"
                            style={{
                              width: `${(day.present / day.total) * 100}%`,
                            }}
                          />
                        )}
                        {day.late > 0 && (
                          <div
                            className="bg-yellow-500 h-full"
                            style={{
                              width: `${(day.late / day.total) * 100}%`,
                            }}
                          />
                        )}
                        {day.absent > 0 && (
                          <div
                            className="bg-red-500 h-full"
                            style={{
                              width: `${(day.absent / day.total) * 100}%`,
                            }}
                          />
                        )}
                        {day.excused > 0 && (
                          <div
                            className="bg-blue-500 h-full"
                            style={{
                              width: `${(day.excused / day.total) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="w-14 text-sm font-medium text-right">
                      {day.attendanceRate}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No attendance records yet
              </p>
            )}
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                Present
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                Late
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                Absent
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                Excused
              </span>
            </div>
          </Card>

          {/* Overall Breakdown */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-4">Overall Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Present</span>
                  <span className="font-medium text-green-600">
                    {analytics.overallStats.present} ({analytics.overallPercentages.presentRate - analytics.overallPercentages.lateRate}%)
                  </span>
                </div>
                <Progress
                  value={analytics.overallPercentages.presentRate - analytics.overallPercentages.lateRate}
                  className="h-2 bg-muted [&>div]:bg-green-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Late</span>
                  <span className="font-medium text-yellow-600">
                    {analytics.overallStats.late} ({analytics.overallPercentages.lateRate}%)
                  </span>
                </div>
                <Progress
                  value={analytics.overallPercentages.lateRate}
                  className="h-2 bg-muted [&>div]:bg-yellow-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Absent</span>
                  <span className="font-medium text-red-600">
                    {analytics.overallStats.absent} ({analytics.overallPercentages.absentRate}%)
                  </span>
                </div>
                <Progress
                  value={analytics.overallPercentages.absentRate}
                  className="h-2 bg-muted [&>div]:bg-red-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Excused</span>
                  <span className="font-medium text-blue-600">
                    {analytics.overallStats.excused} ({analytics.overallPercentages.excusedRate}%)
                  </span>
                </div>
                <Progress
                  value={analytics.overallPercentages.excusedRate}
                  className="h-2 bg-muted [&>div]:bg-blue-500"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {analytics.totalStudents} students enrolled
            </p>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rate">Attendance Rate</SelectItem>
                <SelectItem value="absences">Total Absences</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {sortedStudents.map((student) => (
                <Dialog key={student.studentId}>
                  <DialogTrigger asChild>
                    <Card
                      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback
                            className={cn(
                              "text-xs",
                              getRiskBadgeStyles(student.riskLevel)
                            )}
                          >
                            {getInitials(student.studentName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">
                              {student.studentName}
                            </p>
                            {student.currentStreak >= 5 && (
                              <Flame className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {student.studentIdNumber && (
                              <span>{student.studentIdNumber}</span>
                            )}
                            <span>•</span>
                            <span>{student.stats.total} sessions</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">
                              {student.attendanceRate}%
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", getRiskBadgeStyles(student.riskLevel))}
                            >
                              {getRiskLabel(student.riskLevel)}
                            </Badge>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(student.studentName)}
                          </AvatarFallback>
                        </Avatar>
                        {student.studentName}
                      </DialogTitle>
                      <DialogDescription>
                        {student.studentIdNumber && `ID: ${student.studentIdNumber} • `}
                        {student.studentEmail}
                      </DialogDescription>
                    </DialogHeader>

                    {studentHistory ? (
                      <div className="space-y-4">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <div className="text-lg font-bold text-green-700 dark:text-green-400">
                              {studentHistory.stats.present}
                            </div>
                            <div className="text-xs text-green-600">Present</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                              {studentHistory.stats.late}
                            </div>
                            <div className="text-xs text-yellow-600">Late</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <div className="text-lg font-bold text-red-700 dark:text-red-400">
                              {studentHistory.stats.absent}
                            </div>
                            <div className="text-xs text-red-600">Absent</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                              {studentHistory.stats.excused}
                            </div>
                            <div className="text-xs text-blue-600">Excused</div>
                          </div>
                        </div>

                        {/* Attendance Rate */}
                        <div className="flex items-center gap-3">
                          <Target className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Attendance Rate</span>
                              <span className="font-bold">{studentHistory.attendanceRate}%</span>
                            </div>
                            <Progress value={studentHistory.attendanceRate} className="h-2" />
                          </div>
                        </div>

                        {/* Streak */}
                        {student.currentStreak > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-sm">
                              <strong>{student.currentStreak}</strong> day streak!
                            </span>
                          </div>
                        )}

                        {/* Recent History */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Recent History</h4>
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {studentHistory.records.slice(0, 10).map((record) => (
                                <div
                                  key={record.id}
                                  className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                >
                                  <span className="text-sm">
                                    {formatDate(record.date)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      record.status === "present" &&
                                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                      record.status === "late" &&
                                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                      record.status === "absent" &&
                                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                      record.status === "excused" &&
                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    )}
                                  >
                                    {record.status.charAt(0).toUpperCase() +
                                      record.status.slice(1)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* At Risk Tab */}
        <TabsContent value="at-risk" className="space-y-4 mt-4">
          {analytics.atRiskStudents.length > 0 ? (
            <>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {analytics.atRiskStudents.length} student
                  {analytics.atRiskStudents.length > 1 ? "s" : ""} with attendance
                  concerns
                </p>
              </div>

              <div className="space-y-3">
                {analytics.atRiskStudents.map((student) => (
                  <Card
                    key={student.studentId}
                    className={cn(
                      "p-4",
                      student.riskLevel === "high" && "border-red-300 dark:border-red-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          student.riskLevel === "high" ? "bg-red-500" : "bg-yellow-500"
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {student.studentName}
                            </p>
                            {student.studentIdNumber && (
                              <p className="text-xs text-muted-foreground">
                                {student.studentIdNumber}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={getRiskBadgeStyles(student.riskLevel)}
                          >
                            {getRiskLabel(student.riskLevel)}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Attendance: </span>
                            <span className="font-medium">{student.attendanceRate}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Absences: </span>
                            <span className="font-medium text-red-600">
                              {student.stats.absent}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Late: </span>
                            <span className="font-medium text-yellow-600">
                              {student.stats.late}
                            </span>
                          </div>
                        </div>
                        {student.recentTrend !== null && (
                          <div className="mt-2 text-xs">
                            <span className="text-muted-foreground">Recent trend: </span>
                            <span
                              className={cn(
                                "font-medium",
                                student.recentTrend >= 80
                                  ? "text-green-600"
                                  : student.recentTrend >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              )}
                            >
                              {student.recentTrend}% (last 5 sessions)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="p-8">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  All Students in Good Standing!
                </h3>
                <p className="text-sm text-muted-foreground">
                  No students are currently at risk. Keep up the great work!
                </p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
