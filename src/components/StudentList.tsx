import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserCheck, UserX, Clock, Phone, Mail, MoreVertical, CheckCircle } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "present" | "late" | "absent" | "excused";
  attendanceRate: number;
  totalClasses: number;
  presentCount: number;
}

export const StudentList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [students] = useState<Student[]>([
    {
      id: "STU001",
      name: "Alice Johnson",
      email: "alice.j@university.edu",
      status: "present",
      attendanceRate: 95,
      totalClasses: 20,
      presentCount: 19
    },
    {
      id: "STU002", 
      name: "Bob Smith",
      email: "bob.smith@university.edu",
      status: "late",
      attendanceRate: 88,
      totalClasses: 20,
      presentCount: 17
    },
    {
      id: "STU003",
      name: "Charlie Brown",
      email: "charlie.b@university.edu", 
      status: "absent",
      attendanceRate: 92,
      totalClasses: 20,
      presentCount: 18
    },
    {
      id: "STU004",
      name: "Diana Lee",
      email: "diana.lee@university.edu",
      status: "present",
      attendanceRate: 98,
      totalClasses: 20,
      presentCount: 19
    },
    {
      id: "STU005",
      name: "Eva Martinez",
      email: "eva.m@university.edu",
      status: "present", 
      attendanceRate: 85,
      totalClasses: 20,
      presentCount: 17
    },
    {
      id: "STU006",
      name: "Frank Wilson",
      email: "frank.w@university.edu",
      status: "excused", 
      attendanceRate: 92,
      totalClasses: 20,
      presentCount: 18
    }
  ]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case "late":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "absent":
        return <UserX className="w-4 h-4 text-red-600" />;
      case "excused":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "excused":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const toggleStudentStatus = (studentId: string) => {
    // This would normally update the student's status
    console.log(`Toggling status for student ${studentId}`);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Student List */}
      <div className="space-y-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="p-4 hover:shadow-soft transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatar} alt={student.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{student.name}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(student.status)}`}
                    >
                      {getStatusIcon(student.status)}
                      <span className="ml-1 capitalize">{student.status}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-2">{student.email}</p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Attendance:</span>
                      <span className={`font-semibold ${getAttendanceColor(student.attendanceRate)}`}>
                        {student.attendanceRate}%
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {student.presentCount}/{student.totalClasses} classes
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStudentStatus(student.id)}
                  className="p-2"
                >
                  {getStatusIcon(student.status)}
                </Button>
                
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No students found matching "{searchQuery}"</p>
        </Card>
      )}

      {/* Summary */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Students: {students.length}</span>
          <div className="flex gap-4">
            <span className="text-green-600">
              Present: {students.filter(s => s.status === "present").length}
            </span>
            <span className="text-yellow-600">
              Late: {students.filter(s => s.status === "late").length}  
            </span>
            <span className="text-red-600">
              Absent: {students.filter(s => s.status === "absent").length}
            </span>
            <span className="text-blue-600">
              Excused: {students.filter(s => s.status === "excused").length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};