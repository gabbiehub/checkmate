import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Eye, 
  Save, 
  Users, 
  GripVertical,
  X,
  UserPlus,
  Ban
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Seat interface for internal state
interface Seat {
  x: number;
  y: number;
  studentId?: Id<"users">;
  studentName?: string;
  studentEmail?: string;
  studentIdNumber?: string;
  label: string;
  isEmpty?: boolean;
}

// Student interface
interface Student {
  id: Id<"users">;
  name: string;
  email?: string;
  idNumber?: string;
}

interface SeatPlanBuilderProps {
  classId?: Id<"classes">;
  onSeatPlanChange?: (seatPlan: { rows: number; columns: number; layout: string[][] }) => void;
  readOnly?: boolean;
}

export const SeatPlanBuilder = ({ classId, onSeatPlanChange, readOnly = false }: SeatPlanBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [rows, setRows] = useState(6);
  const [columns, setColumns] = useState(8);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [draggedSeat, setDraggedSeat] = useState<Seat | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Convex queries and mutations
  const seatPlan = useQuery(
    api.seatPlans.getByClass,
    classId ? { classId } : "skip"
  );
  const unassignedStudents = useQuery(
    api.seatPlans.getUnassignedStudents,
    classId ? { classId } : "skip"
  );
  const createOrUpdateMutation = useMutation(api.seatPlans.createOrUpdate);
  const initializeMutation = useMutation(api.seatPlans.initializeSeatPlan);

  // Initialize seats from Convex data or create default
  useEffect(() => {
    if (seatPlan) {
      setRows(seatPlan.rows);
      setColumns(seatPlan.columns);
      setSeats(seatPlan.seats.map((s: any) => ({
        x: s.x,
        y: s.y,
        studentId: s.studentId,
        studentName: s.studentName,
        studentEmail: s.studentEmail,
        studentIdNumber: s.studentIdNumber,
        label: s.label || `${String.fromCharCode(65 + s.y)}${s.x + 1}`,
        isEmpty: s.isEmpty,
      })));
    } else if (seatPlan === null && classId) {
      // No seat plan exists, create default layout
      generateDefaultLayout(rows, columns);
    }
  }, [seatPlan, classId]);

  // Generate default seat layout
  const generateDefaultLayout = useCallback((newRows: number, newCols: number) => {
    const newSeats: Seat[] = [];
    for (let y = 0; y < newRows; y++) {
      for (let x = 0; x < newCols; x++) {
        newSeats.push({
          x,
          y,
          label: `${String.fromCharCode(65 + y)}${x + 1}`,
          isEmpty: false,
        });
      }
    }
    setSeats(newSeats);
    setIsDirty(true);
  }, []);

  const updateLayout = (newRows: number, newCols: number) => {
    // Preserve existing assignments when resizing
    const newSeats: Seat[] = [];
    for (let y = 0; y < newRows; y++) {
      for (let x = 0; x < newCols; x++) {
        const existingSeat = seats.find(s => s.x === x && s.y === y);
        newSeats.push({
          x,
          y,
          label: `${String.fromCharCode(65 + y)}${x + 1}`,
          studentId: existingSeat?.studentId,
          studentName: existingSeat?.studentName,
          studentEmail: existingSeat?.studentEmail,
          studentIdNumber: existingSeat?.studentIdNumber,
          isEmpty: existingSeat?.isEmpty || false,
        });
      }
    }
    setSeats(newSeats);
    setIsDirty(true);
    
    // Callback for legacy support
    const layout = Array(newRows).fill(null).map((_, rowIndex) => 
      Array(newCols).fill(null).map((_, colIndex) => `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`)
    );
    onSeatPlanChange?.({ rows: newRows, columns: newCols, layout });
  };

  const handleRowsChange = (newRows: number) => {
    const validRows = Math.max(1, Math.min(10, newRows));
    setRows(validRows);
    updateLayout(validRows, columns);
  };

  const handleColumnsChange = (newCols: number) => {
    const validCols = Math.max(1, Math.min(12, newCols));
    setColumns(validCols);
    updateLayout(rows, validCols);
  };

  const resetLayout = () => {
    setRows(6);
    setColumns(8);
    generateDefaultLayout(6, 8);
  };

  // Save seat plan to Convex
  const handleSave = async () => {
    if (!classId || !user) {
      toast({
        title: "Error",
        description: "Unable to save. Class or user not found.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const seatsToSave = seats.map(s => ({
        x: s.x,
        y: s.y,
        studentId: s.studentId,
        label: s.label,
        isEmpty: s.isEmpty,
      }));

      await createOrUpdateMutation({
        classId,
        rows,
        columns,
        seats: seatsToSave,
        userId: user.userId,
      });

      setIsDirty(false);
      toast({
        title: "Success",
        description: "Seat plan saved successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save seat plan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize seat plan
  const handleInitialize = async () => {
    if (!classId || !user) return;

    try {
      await initializeMutation({
        classId,
        rows,
        columns,
        userId: user.userId,
      });
      toast({
        title: "Success",
        description: "Seat plan initialized!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize seat plan",
        variant: "destructive",
      });
    }
  };

  // Drag and drop handlers for students
  const handleDragStart = (e: React.DragEvent, student: Student) => {
    if (readOnly) return;
    setDraggedStudent(student);
    setDraggedSeat(null);
    e.dataTransfer.effectAllowed = "move";
  };

  // Drag and drop handlers for seats (moving students between seats)
  const handleSeatDragStart = (e: React.DragEvent, seat: Seat) => {
    if (readOnly || !seat.studentId) return;
    setDraggedSeat(seat);
    setDraggedStudent(null);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSeat: Seat) => {
    e.preventDefault();
    if (readOnly || targetSeat.isEmpty) return;

    if (draggedStudent) {
      // Assign student from unassigned list to seat
      assignStudentToSeat(draggedStudent, targetSeat);
    } else if (draggedSeat && draggedSeat.studentId) {
      // Move student from one seat to another
      swapOrMoveStudent(draggedSeat, targetSeat);
    }

    setDraggedStudent(null);
    setDraggedSeat(null);
  };

  const assignStudentToSeat = (student: Student, targetSeat: Seat) => {
    // Remove student from any existing seat first
    const updatedSeats = seats.map(seat => {
      if (seat.studentId === student.id) {
        return { ...seat, studentId: undefined, studentName: undefined, studentEmail: undefined, studentIdNumber: undefined };
      }
      if (seat.x === targetSeat.x && seat.y === targetSeat.y) {
        return { 
          ...seat, 
          studentId: student.id, 
          studentName: student.name,
          studentEmail: student.email,
          studentIdNumber: student.idNumber,
        };
      }
      return seat;
    });
    
    setSeats(updatedSeats);
    setIsDirty(true);
  };

  const swapOrMoveStudent = (sourceSeat: Seat, targetSeat: Seat) => {
    const updatedSeats = seats.map(seat => {
      if (seat.x === sourceSeat.x && seat.y === sourceSeat.y) {
        // Move target student to source (swap) or clear
        return {
          ...seat,
          studentId: targetSeat.studentId,
          studentName: targetSeat.studentName,
          studentEmail: targetSeat.studentEmail,
          studentIdNumber: targetSeat.studentIdNumber,
        };
      }
      if (seat.x === targetSeat.x && seat.y === targetSeat.y) {
        // Move source student to target
        return {
          ...seat,
          studentId: sourceSeat.studentId,
          studentName: sourceSeat.studentName,
          studentEmail: sourceSeat.studentEmail,
          studentIdNumber: sourceSeat.studentIdNumber,
        };
      }
      return seat;
    });
    
    setSeats(updatedSeats);
    setIsDirty(true);
  };

  const removeStudentFromSeat = (seat: Seat) => {
    if (readOnly) return;
    const updatedSeats = seats.map(s => {
      if (s.x === seat.x && s.y === seat.y) {
        return { ...s, studentId: undefined, studentName: undefined, studentEmail: undefined, studentIdNumber: undefined };
      }
      return s;
    });
    setSeats(updatedSeats);
    setIsDirty(true);
  };

  const toggleSeatEmpty = (seat: Seat) => {
    if (readOnly) return;
    const updatedSeats = seats.map(s => {
      if (s.x === seat.x && s.y === seat.y) {
        return { 
          ...s, 
          isEmpty: !s.isEmpty,
          studentId: !s.isEmpty ? undefined : s.studentId,
          studentName: !s.isEmpty ? undefined : s.studentName,
        };
      }
      return s;
    });
    setSeats(updatedSeats);
    setIsDirty(true);
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const totalSeats = rows * columns;
  const assignedSeats = seats.filter(s => s.studentId && !s.isEmpty).length;
  const emptySeats = seats.filter(s => s.isEmpty).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows" className="text-sm">Rows:</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRowsChange(rows - 1)}
                disabled={rows <= 1 || readOnly}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                id="rows"
                type="number"
                min="1"
                max="10"
                value={rows}
                onChange={(e) => handleRowsChange(parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-center"
                disabled={readOnly}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRowsChange(rows + 1)}
                disabled={rows >= 10 || readOnly}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="columns" className="text-sm">Columns:</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleColumnsChange(columns - 1)}
                disabled={columns <= 1 || readOnly}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                id="columns"
                type="number"
                min="1"
                max="12"
                value={columns}
                onChange={(e) => handleColumnsChange(parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-center"
                disabled={readOnly}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleColumnsChange(columns + 1)}
                disabled={columns >= 12 || readOnly}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {assignedSeats}/{totalSeats - emptySeats} assigned
          </Badge>
          {!readOnly && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetLayout}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
              {classId && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                >
                  <Save className="w-3 h-3 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Unassigned Students Panel */}
        {classId && !readOnly && (
          <Card className="p-4 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-foreground">Unassigned Students</h4>
            </div>
            <ScrollArea className="h-[300px] pr-2">
              {unassignedStudents && unassignedStudents.length > 0 ? (
                <div className="space-y-2">
                  {unassignedStudents.map((student) => (
                    <div
                      key={student.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, student)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border bg-background cursor-grab",
                        "hover:bg-muted/50 transition-colors",
                        "active:cursor-grabbing"
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{student.name}</p>
                        {student.idNumber && (
                          <p className="text-xs text-muted-foreground">{student.idNumber}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All students have been assigned seats</p>
                </div>
              )}
            </ScrollArea>
          </Card>
        )}

        {/* Seat Layout */}
        <Card className={cn("p-4", classId && !readOnly ? "lg:col-span-3" : "lg:col-span-4")}>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-foreground">
              {readOnly ? "Seat Layout" : "Seat Layout (Drag students to assign)"}
            </h4>
          </div>
          
          {/* Teacher's Desk */}
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 border-2 border-dashed border-primary/30 rounded-lg px-6 py-2">
              <span className="text-sm font-medium text-primary">Teacher's Desk</span>
            </div>
          </div>

          {/* Seating Grid */}
          <div 
            className="grid gap-2 justify-center"
            style={{ 
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              maxWidth: `${columns * 70}px`,
              margin: '0 auto'
            }}
          >
            {seats.map((seat) => (
              <div
                key={`${seat.y}-${seat.x}`}
                draggable={!readOnly && !!seat.studentId}
                onDragStart={(e) => handleSeatDragStart(e, seat)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, seat)}
                className={cn(
                  "relative w-16 h-16 rounded-md flex flex-col items-center justify-center text-xs transition-all",
                  seat.isEmpty 
                    ? "bg-muted/30 border-2 border-dashed border-muted-foreground/20" 
                    : seat.studentId
                      ? "bg-primary/10 border-2 border-primary/30 cursor-grab active:cursor-grabbing"
                      : "bg-background border border-border hover:border-primary/50",
                  !readOnly && !seat.isEmpty && "hover:ring-2 hover:ring-primary/20"
                )}
                title={seat.studentId ? seat.studentName : seat.label}
              >
                {seat.isEmpty ? (
                  <Ban className="w-4 h-4 text-muted-foreground/50" />
                ) : seat.studentId ? (
                  <>
                    <Avatar className="h-7 w-7 mb-0.5">
                      <AvatarFallback className="text-[10px] bg-primary/20">
                        {getInitials(seat.studentName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[9px] text-muted-foreground truncate max-w-full px-1">
                      {seat.studentName?.split(" ")[0]}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStudentFromSeat(seat);
                        }}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="font-medium text-foreground">{seat.label}</span>
                )}
                
                {/* Context menu for toggling empty seats */}
                {!readOnly && !seat.studentId && (
                  <button
                    onClick={() => toggleSeatEmpty(seat)}
                    className="absolute -top-1 -right-1 bg-muted text-muted-foreground rounded-full p-0.5 opacity-0 hover:opacity-100 transition-opacity"
                    title={seat.isEmpty ? "Enable seat" : "Disable seat"}
                  >
                    <Ban className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Layout Info */}
          <div className="flex justify-center mt-4 space-x-4 text-xs text-muted-foreground">
            <span>Rows: A-{String.fromCharCode(64 + rows)}</span>
            <span>•</span>
            <span>Columns: 1-{columns}</span>
            <span>•</span>
            <span>Total: {totalSeats} seats</span>
            {emptySeats > 0 && (
              <>
                <span>•</span>
                <span>Disabled: {emptySeats}</span>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Layout Tips */}
      {!readOnly && (
        <div className="bg-accent/50 rounded-lg p-3">
          <h5 className="font-medium text-sm text-foreground mb-2">Layout Tips:</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Drag and drop</strong> students from the list to assign them to seats</li>
            <li>• <strong>Drag between seats</strong> to swap or move students</li>
            <li>• Click the <Ban className="w-3 h-3 inline" /> icon on empty seats to disable them</li>
            <li>• Click the <X className="w-3 h-3 inline" /> icon to remove a student from their seat</li>
            <li>• Don't forget to <strong>Save</strong> your changes!</li>
          </ul>
        </div>
      )}
    </div>
  );
};