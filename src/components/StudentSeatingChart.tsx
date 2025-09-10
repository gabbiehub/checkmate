import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, UserCheck, UserX, Clock, MapPin, Star } from "lucide-react";

type AttendanceStatus = "present" | "late" | "absent" | "empty";

interface Seat {
  id: string;
  studentName?: string;
  studentId?: string;
  nickname?: string;
  avatar?: string;
  status: AttendanceStatus;
  row: number;
  col: number;
}

interface StudentSeatingChartProps {
  studentName: string;
  seatPosition: { row: number; col: number };
}

export const StudentSeatingChart = ({ studentName, seatPosition }: StudentSeatingChartProps) => {
  const [seats] = useState<Seat[]>(() => {
    // Initialize a 6x8 seating arrangement
    const initialSeats: Seat[] = [];
    const students = [
      { name: "Alice Johnson", nickname: "Ali", avatar: "👩‍💼" },
      { name: "Bob Smith", nickname: "Bobby", avatar: "👨‍💻" },
      { name: "Charlie Brown", nickname: "Chuck", avatar: "👦" },
      { name: "Diana Lee", nickname: "Di", avatar: "👩‍🎓" },
      { name: "Eva Martinez", nickname: "Evie", avatar: "👩‍🔬" },
      { name: "Frank Wilson", nickname: "Frankie", avatar: "👨‍🎨" },
      { name: "Grace Chen", nickname: "Gracie", avatar: "👩‍⚕️" },
      { name: "Henry Davis", nickname: "Hank", avatar: "👨‍🏫" },
      { name: "Ivy Taylor", nickname: "Ives", avatar: "👩‍💻" },
      { name: "Jack Miller", nickname: "Jackie", avatar: "👨‍🔧" },
      { name: "Kate Anderson", nickname: "Katie", avatar: "👩‍🎤" },
      { name: "Leo Garcia", nickname: "Lee", avatar: "👨‍🚀" },
      { name: "Maya Patel", nickname: "May", avatar: "👩‍🏭" },
      { name: "Noah Kim", nickname: "Noe", avatar: "👨‍💼" },
      { name: "Olivia White", nickname: "Liv", avatar: "👩‍🎭" },
      { name: "Paul Jones", nickname: "Paulie", avatar: "👨‍🔬" },
      { name: "Quinn Roberts", nickname: "Q", avatar: "👩‍✈️" },
      { name: "Ruby Clark", nickname: "Rubes", avatar: "👩‍🍳" },
      { name: "Sam Thompson", nickname: "Sammy", avatar: "👨‍🎓" },
      { name: "Tina Liu", nickname: "T", avatar: "👩‍🌾" },
      { name: "Uma Singh", nickname: "U", avatar: "👩‍⚖️" },
      { name: "Victor Cruz", nickname: "Vic", avatar: "👨‍🎤" },
      { name: "Wendy Adams", nickname: "Wen", avatar: "👩‍🔧" },
      { name: "Xander Green", nickname: "X", avatar: "👨‍🌾" },
      { name: "Yara Hassan", nickname: "Y", avatar: "👩‍🚀" },
      { name: "Zoe Cooper", nickname: "Z", avatar: "👩‍🏫" },
      { name: "Blake Foster", nickname: "B", avatar: "👨‍🎭" },
      { name: "Cleo Park", nickname: "C", avatar: "👩‍🎨" },
      { name: "Drew Wong", nickname: "D", avatar: "👨‍✈️" },
      { name: "Ella Stone", nickname: "El", avatar: "👩‍🍳" },
      { name: "Felix Burke", nickname: "Fe", avatar: "👨‍🏭" },
      { name: "Gina Ross", nickname: "G", avatar: "👩‍🔬" },
      { name: "Hugo Martinez", nickname: "H", avatar: "👨‍⚖️" },
      { name: "Iris Coleman", nickname: "Iri", avatar: "👩‍🌾" }
    ];

    let studentIndex = 0;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        let hasStudent = studentIndex < students.length && Math.random() > 0.1;
        let currentStudentName = hasStudent ? students[studentIndex].name : undefined;
        
        // Place the current student at their assigned position
        if (row === seatPosition.row && col === seatPosition.col) {
          hasStudent = true;
          currentStudentName = studentName;
        }
        
        // If this is the student's seat but they're not in our mock list, add them
        if (row === seatPosition.row && col === seatPosition.col && !students.find(s => s.name === studentName)) {
          currentStudentName = studentName;
        }

        const status = hasStudent ? 
          (Math.random() > 0.8 ? "absent" : 
           Math.random() > 0.9 ? "late" : "present") : "empty";
        
        initialSeats.push({
          id: `${row}-${col}`,
          studentName: currentStudentName,
          studentId: hasStudent ? `STU${(studentIndex + 1).toString().padStart(3, '0')}` : undefined,
          nickname: hasStudent ? (currentStudentName === studentName ? "You" : students[Math.min(studentIndex, students.length - 1)]?.nickname) : undefined,
          avatar: hasStudent ? (currentStudentName === studentName ? "🙋‍♂️" : students[Math.min(studentIndex, students.length - 1)]?.avatar) : undefined,
          status: status as AttendanceStatus,
          row,
          col
        });
        
        if (hasStudent && currentStudentName !== studentName) studentIndex++;
      }
    }
    
    return initialSeats;
  });

  const getSeatColor = (status: AttendanceStatus, isMyself: boolean = false) => {
    if (isMyself) {
      return "bg-primary/20 border-primary border-2 ring-2 ring-primary/30 shadow-lg";
    }
    
    switch (status) {
      case "present":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "late":
        return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
      case "absent":
        return "bg-red-50 border-red-200 hover:bg-red-100";
      case "empty":
        return "bg-muted border-border opacity-30";
      default:
        return "bg-muted border-border";
    }
  };

  const getSeatIcon = (status: AttendanceStatus, isMyself: boolean = false) => {
    if (isMyself) {
      return <Star className="w-4 h-4 text-primary" fill="currentColor" />;
    }
    
    switch (status) {
      case "present":
        return <UserCheck className="w-3 h-3 text-green-600" />;
      case "late":
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case "absent":
        return <UserX className="w-3 h-3 text-red-600" />;
      case "empty":
        return <div className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const renderSeatContent = (seat: Seat) => {
    if (!seat.studentName) return null;

    const isMyself = seat.row === seatPosition.row && seat.col === seatPosition.col;
    const displayName = isMyself ? "YOU" : seat.studentName.split(' ')[0];
    
    if (isMyself) {
      return (
        <div className="mt-1 leading-tight text-center">
          <div className="text-lg">{seat.avatar}</div>
          <div className="font-bold text-primary text-xs">{displayName}</div>
        </div>
      );
    }
    
    return (
      <div className="mt-1 leading-tight text-center">
        <div className="text-sm opacity-60">{seat.avatar}</div>
        <div className="font-medium text-xs opacity-60 truncate w-full">
          {displayName}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">Seating Chart</h4>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" fill="currentColor" />
            <span className="text-xs text-muted-foreground">Your seat</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Absent</span>
          </div>
        </div>
      </Card>

      {/* Seating Chart */}
      <Card className="p-4 overflow-x-auto">
        <div className="mb-4 text-center">
          <div className="inline-block px-8 py-2 bg-muted rounded-lg text-sm font-medium text-muted-foreground">
            📚 Teacher's Desk / Whiteboard
          </div>
        </div>
        
        <div className="grid grid-cols-8 gap-2 min-w-fit mx-auto">
          {seats.map((seat) => {
            const isMyself = seat.row === seatPosition.row && seat.col === seatPosition.col;
            
            return (
              <div
                key={seat.id}
                className={cn(
                  "h-16 w-16 p-1 flex flex-col items-center justify-center text-xs border-2 rounded-lg transition-all relative",
                  getSeatColor(seat.status, isMyself),
                  seat.studentName ? "cursor-default" : "cursor-not-allowed"
                )}
              >
                {isMyself && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    ★
                  </div>
                )}
                {getSeatIcon(seat.status, isMyself)}
                {renderSeatContent(seat)}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
            <MapPin className="w-4 h-4" />
            You are seated in Row {seatPosition.row + 1}, Column {seatPosition.col + 1}
          </div>
          <p className="text-xs text-muted-foreground">
            Your seat is highlighted with a star and special border
          </p>
        </div>
      </Card>

      {/* Navigation Tips */}
      <Card className="p-4 bg-accent/20">
        <h4 className="font-medium mb-2 text-foreground">💡 Finding Your Seat</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Rows are numbered from front to back (1-6)</p>
          <p>• Columns are numbered from left to right (1-8)</p>
          <p>• Your seat is marked with a ★ and highlighted border</p>
          <p>• Enter from the back and count your way to your position</p>
        </div>
      </Card>
    </div>
  );
};