import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const { user, login } = useAuth();
  const updateUser = useMutation(api.users.updateUser);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    office: "",
  });

  // Initialize form data with user data when dialog opens
  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        office: user.office || "",
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      await updateUser({
        userId: user.userId,
        name: formData.name,
        phone: formData.phone || undefined,
        office: formData.office || undefined,
      });

      // Update local user state
      login({
        ...user,
        name: formData.name,
        phone: formData.phone || undefined,
        office: formData.office || undefined,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  // Get user initials
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {user.idNumber && (
            <div className="space-y-2">
              <Label htmlFor="idNumber">
                {user.role === 'student' ? 'Student ID' : 'Employee ID'}
              </Label>
              <Input
                id="idNumber"
                value={user.idNumber}
                disabled
              />
              <p className="text-xs text-muted-foreground">ID number cannot be changed</p>
            </div>
          )}

          {user.role === 'student' && user.studentLevel && (
            <div className="space-y-2">
              <Label htmlFor="studentLevel">Student Level</Label>
              <Input
                id="studentLevel"
                value={
                  user.studentLevel === 'elementary' ? 'Elementary' :
                  user.studentLevel === 'junior_high' ? 'Junior High' :
                  user.studentLevel === 'senior_high' ? 'Senior High' :
                  'College'
                }
                disabled
              />
              <p className="text-xs text-muted-foreground">Student level cannot be changed</p>
            </div>
          )}

          {user.role === 'teacher' && (
            <div className="space-y-2">
              <Label htmlFor="office">Office</Label>
              <Input
                id="office"
                value={formData.office}
                onChange={(e) => handleInputChange("office", e.target.value)}
                placeholder="Enter your office location"
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};