import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, UserCheck, UserX, Clock } from "lucide-react";

type AttendanceStatus = "present" | "late" | "absent" | "empty";

interface Seat {
  id: string;
  studentName?: string;
  studentId?: string;
  status: AttendanceStatus;
  row: number;
  col: number;
}

export const SeatingChart = () => {
  const [seats, setSeats] = useState<Seat[]>(() => {
    // Initialize a 6x8 seating arrangement
    const initialSeats: Seat[] = [];
    const students = [
      "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Lee", "Eva Martinez",
      "Frank Wilson", "Grace Chen", "Henry Davis", "Ivy Taylor", "Jack Miller",
      "Kate Anderson", "Leo Garcia", "Maya Patel", "Noah Kim", "Olivia White",
      "Paul Jones", "Quinn Roberts", "Ruby Clark", "Sam Thompson", "Tina Liu",
      "Uma Singh", "Victor Cruz", "Wendy Adams", "Xander Green", "Yara Hassan",
      "Zoe Cooper", "Alex Rivera", "Blake Foster", "Cleo Park", "Drew Wong",
      "Ella Stone", "Felix Burke", "Gina Ross", "Hugo Martinez", "Iris Coleman"
    ];

    let studentIndex = 0;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        const hasStudent = studentIndex < students.length && Math.random() > 0.1; // 90% chance of having a student
        const status = hasStudent ? 
          (Math.random() > 0.8 ? "absent" : 
           Math.random() > 0.9 ? "late" : "present") : "empty";
        
        initialSeats.push({
          id: `${row}-${col}`,
          studentName: hasStudent ? students[studentIndex] : undefined,
          studentId: hasStudent ? `STU${(studentIndex + 1).toString().padStart(3, '0')}` : undefined,
          status: status as AttendanceStatus,
          row,
          col
        });
        
        if (hasStudent) studentIndex++;
      }
    }
    
    return initialSeats;
  });

  const toggleSeatStatus = (seatId: string) => {
    setSeats(prevSeats => 
      prevSeats.map(seat => {
        if (seat.id === seatId && seat.studentName) {
          let newStatus: AttendanceStatus;
          switch (seat.status) {
            case "present":
              newStatus = "late";
              break;
            case "late":
              newStatus = "absent";
              break;
            case "absent":
              newStatus = "present";
              break;
            default:
              newStatus = "present";
          }
          return { ...seat, status: newStatus };
        }
        return seat;
      })
    );
  };

  const getSeatColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "bg-green-100 border-green-300 hover:bg-green-200";
      case "late":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
      case "absent":
        return "bg-red-100 border-red-300 hover:bg-red-200";
      case "empty":
        return "bg-muted border-border opacity-30";
      default:
        return "bg-muted border-border";
    }
  };

  const getSeatIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case "late":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "absent":
        return <UserX className="w-4 h-4 text-red-600" />;
      case "empty":
        return <div className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusCounts = () => {
    return seats.reduce((counts, seat) => {
      if (seat.studentName) {
        counts[seat.status as keyof typeof counts]++;
      }
      return counts;
    }, { present: 0, late: 0, absent: 0 });
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">Attendance Legend</h4>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-green-100 text-green-700">
              Present: {statusCounts.present}
            </Badge>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
              Late: {statusCounts.late}
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-700">
              Absent: {statusCounts.absent}
            </Badge>
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
          {seats.map((seat) => (
            <Button
              key={seat.id}
              variant="outline"
              className={cn(
                "h-16 w-16 p-1 flex flex-col items-center justify-center text-xs border-2 transition-all",
                getSeatColor(seat.status),
                seat.studentName ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"
              )}
              onClick={() => seat.studentName && toggleSeatStatus(seat.id)}
              disabled={!seat.studentName}
            >
              {getSeatIcon(seat.status)}
              {seat.studentName && (
                <div className="mt-1 leading-tight text-center">
                  <div className="font-medium truncate w-full">
                    {seat.studentName.split(' ')[0]}
                  </div>
                  <div className="text-xs text-muted-foreground truncate w-full">
                    {seat.studentName.split(' ')[1]}
                  </div>
                </div>
              )}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Tap on seats to mark attendance • Present → Late → Absent → Present
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            setSeats(prev => prev.map(seat => 
              seat.studentName ? { ...seat, status: "present" as AttendanceStatus } : seat
            ));
          }}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Mark All Present
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            setSeats(prev => prev.map(seat => 
              seat.studentName ? { ...seat, status: "absent" as AttendanceStatus } : seat
            ));
          }}
        >
          <UserX className="w-4 h-4 mr-2" />
          Mark All Absent
        </Button>
      </div>
    </div>
  );
};