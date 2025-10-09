import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, Calendar, AlertTriangle, BarChart3, Download, Filter } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { ContactStudentDialog } from "./ContactStudentDialog";
import { useToast } from "@/hooks/use-toast";

export const AnalyticsView = () => {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; class: string } | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);

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
  const overallStats = [
    { title: "Total Classes", value: "12", icon: <Users className="w-4 h-4" />, trend: "+2 from last month" },
    { title: "Total Students", value: "420", icon: <Users className="w-4 h-4" />, trend: "+15 from last month" },
    { title: "Avg. Attendance", value: "89%", icon: <BarChart3 className="w-4 h-4" />, trend: "+3% from last month" },
    { title: "At-Risk Students", value: "23", icon: <AlertTriangle className="w-4 h-4" />, trend: "-5 from last month" },
  ];

  const classPerformance = [
    { name: "Computer Science 101", code: "CS101", attendance: 92, students: 45, trend: "up" },
    { name: "Advanced Mathematics", code: "MATH201", attendance: 89, students: 38, trend: "down" },
    { name: "Physics Laboratory", code: "PHYS150", attendance: 85, students: 28, trend: "up" },
    { name: "English Literature", code: "ENG102", attendance: 78, students: 42, trend: "down" },
  ];

  const atRiskStudents = [
    { name: "John Doe", class: "CS101", absences: 8, allowableRemaining: 2 },
    { name: "Jane Smith", class: "MATH201", absences: 7, allowableRemaining: 3 },
    { name: "Mike Johnson", class: "PHYS150", absences: 9, allowableRemaining: 1 },
  ];

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
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {overallStats.map((stat, index) => (
              <StatsCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                className="shadow-card"
              />
            ))}
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
          
          <div className="space-y-3">
            {classPerformance.map((classItem, index) => (
              <Card key={index} className="p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{classItem.name}</h3>
                      <Badge variant="outline" className="text-xs">{classItem.code}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{classItem.students} students</span>
                      <span>•</span>
                      <span>{classItem.attendance}% attendance</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {classItem.trend === "up" ? (
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
        </div>

        {/* At-Risk Students */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">At-Risk Students</h2>
            <Badge variant="destructive" className="text-xs">
              {atRiskStudents.length} students
            </Badge>
          </div>
          
          <div className="space-y-3">
            {atRiskStudents.map((student, index) => (
              <Card key={index} className="p-4 shadow-card border-l-4 border-l-destructive">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">{student.name}</h3>
                      <Badge variant="outline" className="text-xs">{student.class}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {student.absences} absences • {student.allowableRemaining} remaining
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <Button variant="outline" size="sm" onClick={() => handleContactStudent(student)}>
                      Contact
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Attendance Trends */}
        <Card className="p-4 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Attendance Trends</h2>
            <Select defaultValue="last-30-days">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">7 days</SelectItem>
                <SelectItem value="last-30-days">30 days</SelectItem>
                <SelectItem value="last-90-days">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Placeholder for chart - in a real app, you'd use a charting library */}
          <div className="h-32 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Attendance trend chart</p>
            </div>
          </div>
        </Card>
      </div>

      <ContactStudentDialog 
        open={showContactDialog} 
        onOpenChange={setShowContactDialog}
        studentName={selectedStudent?.name || ""}
      />
    </div>
  );
};