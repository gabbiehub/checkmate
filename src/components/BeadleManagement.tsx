import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, UserMinus, Plus, Loader2, Shield, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BeadleManagementProps {
  classId: string;
}

export const BeadleManagement = ({ classId }: BeadleManagementProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Fetch beadles and available students
  const beadles = useQuery(api.classes.getClassBeadles, {
    classId: classId as Id<"classes">,
  });

  const availableStudents = useQuery(api.classes.getAvailableStudentsForBeadle, {
    classId: classId as Id<"classes">,
  });

  // Mutations
  const assignBeadle = useMutation(api.classes.assignBeadle);
  const revokeBeadleAccess = useMutation(api.classes.revokeBeadleAccess);

  const handleAssignBeadle = async () => {
    if (!selectedStudent || !user) return;

    setIsAssigning(true);
    try {
      await assignBeadle({
        classId: classId as Id<"classes">,
        studentId: selectedStudent as Id<"users">,
      });
      setSelectedStudent("");
      toast({
        title: "Beadle Assigned",
        description: "Student has been assigned as a class beadle.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign beadle",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeAccess = async (studentId: string) => {
    if (!user) return;

    setRevokingId(studentId);
    try {
      await revokeBeadleAccess({
        classId: classId as Id<"classes">,
        studentId: studentId as Id<"users">,
      });
      toast({
        title: "Access Revoked",
        description: "Beadle privileges have been removed from the student.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke beadle access",
        variant: "destructive",
      });
    } finally {
      setRevokingId(null);
    }
  };

  const isLoading = beadles === undefined || availableStudents === undefined;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-600" />
          Beadle Management
        </CardTitle>
        <CardDescription>
          Beadles can mark attendance and help manage class activities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Beadles */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Current Beadles ({beadles?.length || 0})
          </h4>
          
          {beadles && beadles.length > 0 ? (
            <div className="space-y-2">
              {beadles.map((beadle) => (
                <div
                  key={beadle.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-amber-100 text-amber-800">
                        {beadle.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{beadle.name}</p>
                        <Badge variant="secondary" className="bg-amber-200 text-amber-800 text-xs">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Beadle
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{beadle.email}</p>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={revokingId === beadle.id}
                      >
                        {revokingId === beadle.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          Revoke Beadle Access
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to revoke beadle privileges from{" "}
                          <span className="font-semibold">{beadle.name}</span>?
                          They will no longer be able to mark attendance or access beadle features.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRevokeAccess(beadle.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Revoke Access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg border-dashed">
              <UserCheck className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No beadles assigned yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Assign a student below to help manage attendance
              </p>
            </div>
          )}
        </div>

        {/* Assign New Beadle */}
        {availableStudents && availableStudents.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Assign New Beadle
            </h4>
            <div className="flex gap-2">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <span>{student.name}</span>
                        <span className="text-xs text-muted-foreground">({student.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignBeadle}
                disabled={!selectedStudent || isAssigning}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isAssigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Assign
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {availableStudents && availableStudents.length === 0 && beadles && beadles.length > 0 && (
          <p className="text-sm text-muted-foreground text-center pt-4 border-t">
            All students in this class have been assigned as beadles.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
