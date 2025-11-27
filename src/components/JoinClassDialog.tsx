import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClassJoined?: (classId: string) => void;
}

export const JoinClassDialog = ({ open, onOpenChange, onClassJoined }: JoinClassDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const joinClass = useMutation(api.classes.joinClass);
  const [classCode, setClassCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to join a class.",
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);

    try {
      const result = await joinClass({
        code: classCode.trim().toUpperCase(),
        studentId: user.userId,
      });

      toast({
        title: "Class Joined!",
        description: `Successfully joined ${result.name}`,
      });
      
      onClassJoined?.(result._id);
      onOpenChange(false);
      setClassCode("");
    } catch (error) {
      toast({
        title: "Error Joining Class",
        description: error instanceof Error ? error.message : "Failed to join class",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleQRScan = () => {
    // Simulate QR code scanning
    toast({
      title: "QR Scanner",
      description: "QR code scanning would open camera here",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR Scan
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="space-y-4">
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-code">Class Code</Label>
                <Input
                  id="class-code"
                  placeholder="Enter class code (e.g., MATH101)"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isJoining}>
                {isJoining ? "Joining..." : "Join Class"}
              </Button>
            </form>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Ask your teacher for the class code
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="qr" className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Camera view would appear here
                  </p>
                </div>
              </div>
              
              <Button onClick={handleQRScan} className="w-full">
                Open Camera
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Point your camera at the QR code provided by your teacher
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};