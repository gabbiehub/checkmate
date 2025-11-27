import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, UserCheck, Lock, MapPin, Star } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type AttendanceStatus = "present" | "late" | "absent" | "excused" | "empty";

interface Seat {
  id: string;
  studentName?: string;
  studentId?: Id<"users">;
  status: AttendanceStatus;
  row: number;
  col: number;
  isCurrentUser?: boolean;
}

interface StudentSeatingChartProps {
  classId: Id<"classes">;
  studentId: Id<"users">;
  onSeatSelect?: (row: number, col: number) => void;
  canSelectSeat?: boolean;
}

export const StudentSeatingChart = ({ 
  classId, 
  studentId, 
  onSeatSelect,
  canSelectSeat = true 
}: StudentSeatingChartProps) => {
  // Fetch real seating data
  const seatingData = useQuery(api.classes.getSeatingChart, { classId });

  if (!seatingData) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Loading seating chart...</p>
      </Card>
    );
  }

  const { rows, cols, finalized, seats: assignments } = seatingData;

  // Create seat grid
  const seats: Seat[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const assignment = assignments.find(a => a.row === row && a.col === col);
      const isCurrentUser = assignment?.studentId === studentId;
      
      seats.push({
        id: `${row}-${col}`,
        studentName: assignment?.studentName,
        studentId: assignment?.studentId,
        status: assignment ? "present" : "empty",
        row,
        col,
        isCurrentUser,
      });
    }
  }

  const handleSeatClick = (seat: Seat) => {
    if (!canSelectSeat || finalized) return;
    
    // Can only select empty seats or your own seat
    if (seat.status === "empty" || seat.isCurrentUser) {
      onSeatSelect?.(seat.row, seat.col);
    }
  };

  const getSeatColor = (status: AttendanceStatus, isCurrentUser: boolean = false) => {
    if (isCurrentUser) {
      return "bg-primary/20 border-primary border-4";
    }
    
    switch (status) {
      case "present":
        return "bg-blue-100 border-blue-300";
      case "empty":
        return "bg-muted border-border hover:bg-accent/50 hover:border-primary cursor-pointer";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getSeatIcon = (status: AttendanceStatus, isCurrentUser: boolean = false) => {
    if (isCurrentUser) {
      return <Star className="w-4 h-4 text-primary" fill="currentColor" />;
    }
    
    switch (status) {
      case "present":
        return <UserCheck className="w-3 h-3 text-blue-600" />;
      case "empty":
        return <div className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const renderSeatContent = (seat: Seat) => {
    if (seat.isCurrentUser) {
      return (
        <div className="mt-1 leading-tight text-center">
          <div className="font-bold text-primary text-xs">YOU</div>
        </div>
      );
    }
    
    if (!seat.studentName) {
      if (!finalized && canSelectSeat) {
        return (
          <div className="mt-1 leading-tight text-center">
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        );
      }
      return null;
    }
    
    const firstName = seat.studentName.split(' ')[0];
    return (
      <div className="mt-1 leading-tight text-center">
        <div className="font-medium text-xs opacity-60 truncate w-full">
          {firstName}
        </div>
      </div>
    );
  };

  // Find current user's seat position
  const mySeat = seats.find(s => s.isCurrentUser);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">Seating Chart</h4>
          {finalized && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Finalized
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary/20 border-2 border-primary rounded"></div>
            <span>Your seat</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-muted border border-border rounded"></div>
            <span>Available</span>
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
        
        <div 
          className="grid gap-2 min-w-fit mx-auto" 
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {seats.map((seat) => {
            const isClickable = !finalized && canSelectSeat && (seat.status === "empty" || seat.isCurrentUser);
            
            return (
              <div
                key={seat.id}
                onClick={() => isClickable && handleSeatClick(seat)}
                className={cn(
                  "h-16 w-16 p-1 flex flex-col items-center justify-center text-xs border-2 rounded-lg transition-all relative",
                  getSeatColor(seat.status, seat.isCurrentUser),
                  isClickable && "cursor-pointer"
                )}
              >
                {seat.isCurrentUser && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                    ★
                  </div>
                )}
                {getSeatIcon(seat.status, seat.isCurrentUser)}
                {renderSeatContent(seat)}
              </div>
            );
          })}
        </div>
        
        {mySeat && (
          <div className="mt-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
              <MapPin className="w-4 h-4" />
              You are seated in Row {mySeat.row + 1}, Column {mySeat.col + 1}
            </div>
            <p className="text-xs text-muted-foreground">
              Your seat is highlighted with a star and special border
            </p>
          </div>
        )}
        
        {!mySeat && !finalized && canSelectSeat && (
          <div className="mt-4 text-center p-3 bg-accent/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Click on any available (gray) seat to claim it
            </p>
          </div>
        )}
      </Card>

      {/* Navigation Tips */}
      {mySeat && (
        <Card className="p-4 bg-accent/20">
          <h4 className="font-medium mb-2 text-foreground">💡 Finding Your Seat</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Rows are numbered from front to back (1-{rows})</p>
            <p>• Columns are numbered from left to right (1-{cols})</p>
            <p>• Your seat is marked with a ★ and highlighted border</p>
            <p>• Enter from the back and count your way to your position</p>
          </div>
        </Card>
      )}
    </div>
  );
};
