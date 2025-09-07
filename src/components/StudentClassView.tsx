import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, TrendingUp, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface StudentClassViewProps {
  classId: string;
  onBack: () => void;
}

export const StudentClassView = ({ classId, onBack }: StudentClassViewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock class data
  const classData = {
    name: "Math 101 - Algebra",
    instructor: "Dr. Sarah Johnson",
    schedule: "Mon, Wed, Fri - 9:00 AM",
    room: "Room 205, Science Building",
    code: "MATH101",
    myAttendance: 92,
    totalClasses: 24,
    present: 22,
    late: 2,
    absent: 0
  };

  const attendanceHistory = [
    { date: "2024-01-10", status: "present", time: "8:58 AM" },
    { date: "2024-01-08", status: "present", time: "9:02 AM" },
    { date: "2024-01-05", status: "late", time: "9:15 AM" },
    { date: "2024-01-03", status: "present", time: "8:55 AM" },
    { date: "2024-01-01", status: "present", time: "9:01 AM" },
  ];

  const upcomingAssignments = [
    {
      id: 1,
      title: "Linear Equations Worksheet",
      dueDate: "2024-01-15",
      type: "homework",
      status: "pending"
    },
    {
      id: 2,
      title: "Chapter 5 Quiz",
      dueDate: "2024-01-18",
      type: "quiz",
      status: "upcoming"
    }
  ];

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
            <h1 className="text-xl font-bold">{classData.name}</h1>
            <p className="text-sm text-muted-foreground">{classData.instructor}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Class Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{classData.schedule}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{classData.room}</span>
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
              <span className="text-2xl font-bold text-primary">{classData.myAttendance}%</span>
            </div>
            <Progress value={classData.myAttendance} className="mb-4" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-green-600">{classData.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-yellow-600">{classData.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-red-600">{classData.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {assignment.type}
                    </Badge>
                  </div>
                ))}
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
                    <span className="text-sm font-medium">{classData.myAttendance}%</span>
                    <Badge variant="secondary" className="text-xs">+5% above avg</Badge>
                  </div>
                </div>
                <Progress value={classData.myAttendance} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <CardDescription>
                  Your recent attendance records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {attendanceHistory.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Marked at {record.time}
                        </p>
                      </div>
                    </div>
                    <Badge className={`capitalize ${getStatusColor(record.status)}`}>
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};