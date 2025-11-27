import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserCheck, UserX, Clock, Phone, Mail, MoreVertical, CheckCircle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface StudentListProps {
  classId: Id<"classes">;
}

export const StudentList = ({ classId }: StudentListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch real student data
  const students = useQuery(api.classes.getClassStudents, { classId });

  if (!students) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading students...</p>
        </Card>
      </div>
    );
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.idNumber && student.idNumber.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <Card key={student._id} className="p-4 hover:shadow-soft transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatarUrl} alt={student.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{student.name}</h4>
                    {student.seatAssignment && (
                      <Badge variant="outline" className="text-xs">
                        Seat: Row {student.seatAssignment.row + 1}, Col {student.seatAssignment.col + 1}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-2">{student.email}</p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    {student.idNumber && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-medium">{student.idNumber}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span className="text-muted-foreground">{student.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="p-2">
                  <Mail className="w-4 h-4" />
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
          <span className="text-muted-foreground">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'} shown
          </span>
        </div>
      </Card>
    </div>
  );
};