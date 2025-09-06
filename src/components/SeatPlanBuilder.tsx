import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, RotateCcw, Eye } from "lucide-react";

interface SeatPlanBuilderProps {
  onSeatPlanChange?: (seatPlan: { rows: number; columns: number; layout: string[][] }) => void;
}

export const SeatPlanBuilder = ({ onSeatPlanChange }: SeatPlanBuilderProps) => {
  const [rows, setRows] = useState(6);
  const [columns, setColumns] = useState(8);
  const [seatLayout, setSeatLayout] = useState<string[][]>(() => {
    return Array(6).fill(null).map((_, rowIndex) => 
      Array(8).fill(null).map((_, colIndex) => `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`)
    );
  });

  const updateLayout = (newRows: number, newCols: number) => {
    const newLayout = Array(newRows).fill(null).map((_, rowIndex) => 
      Array(newCols).fill(null).map((_, colIndex) => `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`)
    );
    setSeatLayout(newLayout);
    onSeatPlanChange?.({ rows: newRows, columns: newCols, layout: newLayout });
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
    updateLayout(6, 8);
  };

  const totalSeats = rows * columns;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows" className="text-sm">Rows:</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRowsChange(rows - 1)}
                disabled={rows <= 1}
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
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRowsChange(rows + 1)}
                disabled={rows >= 10}
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
                disabled={columns <= 1}
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
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleColumnsChange(columns + 1)}
                disabled={columns >= 12}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {totalSeats} seats
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetLayout}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Seat Layout Preview */}
      <Card className="p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-foreground">Seat Layout Preview</h4>
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
            maxWidth: `${columns * 50}px`,
            margin: '0 auto'
          }}
        >
          {seatLayout.map((row, rowIndex) =>
            row.map((seat, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-10 h-10 bg-background border border-border rounded-md flex items-center justify-center text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                title={`Seat ${seat}`}
              >
                {seat}
              </div>
            ))
          )}
        </div>

        {/* Layout Info */}
        <div className="flex justify-center mt-4 space-x-4 text-xs text-muted-foreground">
          <span>Rows: A-{String.fromCharCode(64 + rows)}</span>
          <span>•</span>
          <span>Columns: 1-{columns}</span>
          <span>•</span>
          <span>Total: {totalSeats} seats</span>
        </div>
      </Card>

      {/* Layout Tips */}
      <div className="bg-accent/50 rounded-lg p-3">
        <h5 className="font-medium text-sm text-foreground mb-2">Layout Tips:</h5>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Seats are automatically labeled (A1, A2, B1, B2, etc.)</li>
          <li>• Consider classroom door and window positions</li>
          <li>• Leave space for student movement between rows</li>
          <li>• You can modify this layout later in class settings</li>
        </ul>
      </div>
    </div>
  );
};