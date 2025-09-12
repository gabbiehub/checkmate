import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, UserCheck, UserX, Clock, Settings, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AttendanceStatus = "present" | "late" | "absent" | "excused" | "empty";

type DisplayMode = 
  | "full-name" 
  | "first-name" 
  | "last-name" 
  | "nickname" 
  | "picture" 
  | "first-name-picture"
  | "last-name-picture" 
  | "nickname-picture"
  | "full-name-picture"
  | "student-id"
  | "student-id-picture";

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

export const SeatingChart = () => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full-name");
  const [seats, setSeats] = useState<Seat[]>(() => {
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
      { name: "Alex Rivera", nickname: "Lex", avatar: "👨‍⚕️" },
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
        const hasStudent = studentIndex < students.length && Math.random() > 0.1; // 90% chance of having a student
        const status = hasStudent ? 
          (Math.random() > 0.85 ? "absent" : 
           Math.random() > 0.93 ? "late" : 
           Math.random() > 0.98 ? "excused" : "present") : "empty";
        
        initialSeats.push({
          id: `${row}-${col}`,
          studentName: hasStudent ? students[studentIndex].name : undefined,
          studentId: hasStudent ? `STU${(studentIndex + 1).toString().padStart(3, '0')}` : undefined,
          nickname: hasStudent ? students[studentIndex].nickname : undefined,
          avatar: hasStudent ? students[studentIndex].avatar : undefined,
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
              newStatus = "excused";
              break;
            case "excused":
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
      case "excused":
        return "bg-blue-100 border-blue-300 hover:bg-blue-200";
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
      case "excused":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
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
    }, { present: 0, late: 0, absent: 0, excused: 0 });
  };

  const statusCounts = getStatusCounts();

  const getDisplayModeLabel = (mode: DisplayMode) => {
    const labels = {
      "full-name": "Full Name",
      "first-name": "First Name Only", 
      "last-name": "Last Name Only",
      "nickname": "Nickname Only",
      "picture": "Picture Only",
      "first-name-picture": "First Name + Picture",
      "last-name-picture": "Last Name + Picture",
      "nickname-picture": "Nickname + Picture", 
      "full-name-picture": "Full Name + Picture",
      "student-id": "Student ID Only",
      "student-id-picture": "Student ID + Picture"
    };
    return labels[mode];
  };

  const renderSeatContent = (seat: Seat) => {
    if (!seat.studentName) return null;

    const firstName = seat.studentName.split(' ')[0];
    const lastName = seat.studentName.split(' ')[1] || '';
    
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
      case "nickname":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="font-medium truncate w-full text-xs">{seat.nickname}</div>
          </div>
        );
      case "picture":
        return (
          <div className="mt-1 text-center">
            <div className="text-lg">{seat.avatar}</div>
          </div>
        );
      case "first-name-picture":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="text-sm">{seat.avatar}</div>
            <div className="font-medium truncate w-full text-xs">{firstName}</div>
          </div>
        );
      case "last-name-picture":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="text-sm">{seat.avatar}</div>
            <div className="font-medium truncate w-full text-xs">{lastName}</div>
          </div>
        );
      case "nickname-picture":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="text-sm">{seat.avatar}</div>
            <div className="font-medium truncate w-full text-xs">{seat.nickname}</div>
          </div>
        );
      case "full-name-picture":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="text-sm">{seat.avatar}</div>
            <div className="font-medium truncate w-full text-xs">{firstName}</div>
            <div className="text-xs text-muted-foreground truncate w-full">{lastName}</div>
          </div>
        );
      case "student-id":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="font-medium truncate w-full text-xs">{seat.studentId}</div>
          </div>
        );
      case "student-id-picture":
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="text-sm">{seat.avatar}</div>
            <div className="font-medium truncate w-full text-xs">{seat.studentId}</div>
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
      {/* Display Mode Selector */}
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
              <SelectItem value="nickname">Nickname Only</SelectItem>
              <SelectItem value="picture">Picture Only</SelectItem>
              <SelectItem value="first-name-picture">First Name + Picture</SelectItem>
              <SelectItem value="last-name-picture">Last Name + Picture</SelectItem>
              <SelectItem value="nickname-picture">Nickname + Picture</SelectItem>
              <SelectItem value="full-name-picture">Full Name + Picture</SelectItem>
              <SelectItem value="student-id">Student ID Only</SelectItem>
              <SelectItem value="student-id-picture">Student ID + Picture</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

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
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              Excused: {statusCounts.excused}
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
              {renderSeatContent(seat)}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Tap on seats to mark attendance • Present → Late → Absent → Excused → Present
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
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
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            setSeats(prev => prev.map(seat => 
              seat.studentName ? { ...seat, status: "excused" as AttendanceStatus } : seat
            ));
          }}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All Excused
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            setSeats(prev => prev.map(seat => 
              seat.studentName ? { ...seat, status: "late" as AttendanceStatus } : seat
            ));
          }}
        >
          <Clock className="w-4 h-4 mr-2" />
          Mark All Late
        </Button>
      </div>
    </div>
  );
};