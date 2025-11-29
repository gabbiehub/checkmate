import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, Calendar, AlertTriangle, BarChart3, Download, Filter, BookOpen, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { ContactStudentDialog } from "./ContactStudentDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Progress } from "@/components/ui/progress";

export const AnalyticsView = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; class: string } | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Fetch analytics data based on user role
  const teacherAnalytics = useQuery(
    api.classes.getTeacherAnalytics,
    user?.role === "teacher" ? { teacherId: user.userId } : "skip"
  );

  const studentAnalytics = useQuery(
    api.classes.getStudentAnalytics,
    user?.role === "student" ? { studentId: user.userId } : "skip"
  );

  const isTeacher = user?.role === "teacher";
  const analytics = isTeacher ? teacherAnalytics : studentAnalytics;
  const isLoading = analytics === undefined;

  const handleExport = () => {
    toast({
      title: "Exporting Report",
      description: "Your analytics report is being generated...",
    });
  };

  const handleFilter = () => {
    toast({
      title: "Filters",
      description: "Advanced filter options coming soon!",
    });
  };

  const handleViewDetails = () => {
    toast({
      title: "Class Details",
      description: "Detailed class analytics view coming soon!",
    });
  };

  const handleContactStudent = (student: { name: string; class: string }) => {
    setSelectedStudent(student);
    setShowContactDialog(true);
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }
  // Render Teacher Analytics
  if (isTeacher && teacherAnalytics) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-primary-foreground/80">Track performance & insights</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Time Range Filter */}
          <div className="flex gap-3">
            <Select defaultValue="this-month">
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-semester">This Semester</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleFilter}>
              <Filter className="w-3 h-3 mr-1" />
              Filter
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 -mt-4 space-y-6">
          {/* Overall Statistics */}
          <div className="mt-6"> 
            <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                title="Total Classes"
                value={teacherAnalytics.totalClasses.toString()}
                icon={<BookOpen className="w-4 h-4" />}
                className="shadow-card"
              />
              <StatsCard
                title="Total Students"
                value={teacherAnalytics.totalStudents.toString()}
                icon={<Users className="w-4 h-4" />}
                className="shadow-card"
              />
              <StatsCard
                title="Avg. Attendance"
                value={`${teacherAnalytics.averageAttendance}%`}
                icon={<BarChart3 className="w-4 h-4" />}
                className="shadow-card"
              />
              <StatsCard
                title="At-Risk Students"
                value={teacherAnalytics.atRiskStudents.length.toString()}
                icon={<AlertTriangle className="w-4 h-4" />}
                className="shadow-card"
              />
            </div>
          </div>

          {/* Class Performance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Class Performance</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={handleViewDetails}>
                View Details
              </Button>
            </div>
            
            {teacherAnalytics.classPerformance.length > 0 ? (
              <div className="space-y-3">
                {teacherAnalytics.classPerformance.map((classItem) => (
                  <Card key={classItem.id} className="p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{classItem.description || classItem.name}</h3>
                          <Badge variant="outline" className="text-xs">{classItem.code}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{classItem.students} students</span>
                          <span>•</span>
                          <span>{classItem.totalSessions} sessions</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {classItem.attendance >= 80 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-lg font-semibold text-foreground">
                          {classItem.attendance}%
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No classes yet</p>
              </Card>
            )}
          </div>

          {/* At-Risk Students */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">At-Risk Students</h2>
              <Badge variant="destructive" className="text-xs">
                {teacherAnalytics.atRiskStudents.length} students
              </Badge>
            </div>
            
            {teacherAnalytics.atRiskStudents.length > 0 ? (
              <div className="space-y-3">
                {teacherAnalytics.atRiskStudents.map((student, index) => (
                  <Card key={index} className="p-4 shadow-card border-l-4 border-l-destructive">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{student.name}</h3>
                          <Badge variant="outline" className="text-xs">{student.classCode}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {student.absences} absences • {student.allowableRemaining} remaining allowed
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleContactStudent({ name: student.name, class: student.className })}
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-muted-foreground">No at-risk students! Great job!</p>
              </Card>
            )}
          </div>

          {/* Attendance Trends */}
          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Weekly Attendance Trends</h2>
            </div>
            
            {teacherAnalytics.recentTrends.some(t => t.attendance > 0) ? (
              <div className="space-y-2">
                {teacherAnalytics.recentTrends.map((trend, index) => {
                  const date = new Date(trend.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-muted-foreground">
                        {dayName} {dateStr}
                      </div>
                      <div className="flex-1">
                        <Progress value={trend.attendance} className="h-2" />
                      </div>
                      <div className="w-12 text-sm font-medium text-right">
                        {trend.attendance > 0 ? `${trend.attendance}%` : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No attendance data yet</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        <ContactStudentDialog 
          open={showContactDialog} 
          onOpenChange={setShowContactDialog}
          studentName={selectedStudent?.name || ""}
        />
      </div>
    );
  }

  // Render Student Analytics
  if (!isTeacher && studentAnalytics) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Analytics</h1>
              <p className="text-primary-foreground/80">Track your attendance & performance</p>
            </div>
          </div>

          {/* Overall Attendance Card */}
          <Card className="bg-white/10 border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/70 text-sm">Overall Attendance</p>
                <p className="text-3xl font-bold">{studentAnalytics.overallAttendance}%</p>
              </div>
              <div className="text-right">
                <p className="text-primary-foreground/70 text-sm">Classes Enrolled</p>
                <p className="text-3xl font-bold">{studentAnalytics.totalClasses}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="px-6 -mt-4 space-y-6">
          {/* Attendance Stats */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-4 gap-2">
              <Card className="p-3 text-center shadow-card">
                <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <p className="text-lg font-bold text-green-600">{studentAnalytics.stats.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </Card>
              <Card className="p-3 text-center shadow-card">
                <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                <p className="text-lg font-bold text-yellow-600">{studentAnalytics.stats.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </Card>
              <Card className="p-3 text-center shadow-card">
                <XCircle className="w-5 h-5 mx-auto mb-1 text-red-600" />
                <p className="text-lg font-bold text-red-600">{studentAnalytics.stats.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </Card>
              <Card className="p-3 text-center shadow-card">
                <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <p className="text-lg font-bold text-blue-600">{studentAnalytics.stats.excused}</p>
                <p className="text-xs text-muted-foreground">Excused</p>
              </Card>
            </div>
          </div>

          {/* Class Performance */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Class Performance</h2>
            
            {studentAnalytics.classPerformance.length > 0 ? (
              <div className="space-y-3">
                {studentAnalytics.classPerformance.map((classItem) => (
                  <Card key={classItem.id} className="p-4 shadow-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{classItem.description || classItem.name}</h3>
                        <Badge variant="outline" className="text-xs">{classItem.code}</Badge>
                      </div>
                      <span className={`text-lg font-semibold ${
                        classItem.attendance >= 80 ? 'text-green-600' : 
                        classItem.attendance >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {classItem.attendance}%
                      </span>
                    </div>
                    <Progress 
                      value={classItem.attendance} 
                      className="h-2 mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{classItem.present} present</span>
                      <span>{classItem.late} late</span>
                      <span>{classItem.absent} absent</span>
                      <span>{classItem.totalSessions} total</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No classes enrolled yet</p>
              </Card>
            )}
          </div>

          {/* Recent Attendance */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Attendance</h2>
            
            {studentAnalytics.recentAttendance.length > 0 ? (
              <Card className="p-4 shadow-card">
                <div className="space-y-2">
                  {studentAnalytics.recentAttendance.map((record, index) => {
                    const date = new Date(record.date);
                    const dateStr = date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                    
                    const statusConfig = {
                      present: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
                      late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                      absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
                      excused: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
                    };
                    
                    const config = statusConfig[record.status as keyof typeof statusConfig];
                    const Icon = config.icon;
                    
                    return (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm text-muted-foreground">{dateStr}</span>
                        <Badge className={`${config.bg} ${config.color} border-0`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {record.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No attendance records yet</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
      <p className="text-muted-foreground">Unable to load analytics</p>
    </div>
  );
};