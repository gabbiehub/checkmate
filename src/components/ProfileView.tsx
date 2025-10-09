import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  Edit3,
  Camera
} from "lucide-react";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { AccountSettingsDialog } from "@/components/AccountSettingsDialog";
import { PrivacySecurityDialog } from "@/components/PrivacySecurityDialog";
import { HelpSupportDialog } from "@/components/HelpSupportDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProfileViewProps {
  onSignOut?: () => void;
}

export const ProfileView = ({ onSignOut }: ProfileViewProps) => {
  const { toast } = useToast();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showPrivacySecurity, setShowPrivacySecurity] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  
  const handleImageUpload = () => {
    toast({
      title: "Upload Photo",
      description: "Photo upload feature coming soon!",
    });
  };

  const profileData = {
    name: "Prof. John Smith",
    email: "john.smith@university.edu",
    phone: "+1 (555) 123-4567",
    department: "Computer Science",
    office: "Room 204, CS Building",
    employeeId: "CS2024001",
    joinDate: "August 2020"
  };

  const preferences = [
    { id: "notifications", label: "Push Notifications", enabled: true },
    { id: "email_alerts", label: "Email Alerts", enabled: true },
    { id: "attendance_reminders", label: "Attendance Reminders", enabled: false },
    { id: "weekly_reports", label: "Weekly Reports", enabled: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-primary-foreground/80">Manage your account</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowEditProfile(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 space-y-6">
        {/* Profile Info */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src="/placeholder.svg" alt="Profile" />
                <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                  JS
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                onClick={handleImageUpload}
              >
                <Camera className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-1">{profileData.name}</h2>
              <p className="text-muted-foreground mb-2">{profileData.department}</p>
              <Badge variant="outline">Teacher</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex">
                  <Mail className="w-4 h-4 mt-3 mr-3 text-muted-foreground" />
                  <Input id="email" value={profileData.email} readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <Phone className="w-4 h-4 mt-3 mr-3 text-muted-foreground" />
                  <Input id="phone" value={profileData.phone} readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="office">Office Location</Label>
                <div className="flex">
                  <MapPin className="w-4 h-4 mt-3 mr-3 text-muted-foreground" />
                  <Input id="office" value={profileData.office} readOnly />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Employment Details */}
        <Card className="p-4 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Employment Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Employee ID</span>
              <span className="font-medium text-foreground">{profileData.employeeId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium text-foreground">{profileData.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Join Date</span>
              <span className="font-medium text-foreground">{profileData.joinDate}</span>
            </div>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
          </div>
          
          <div className="space-y-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="flex items-center justify-between">
                <Label htmlFor={pref.id} className="text-sm font-medium text-foreground">
                  {pref.label}
                </Label>
                <Switch id={pref.id} defaultChecked={pref.enabled} />
              </div>
            ))}
          </div>
        </Card>

        {/* Account Settings */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start h-12" onClick={() => setShowAccountSettings(true)}>
            <Settings className="w-4 h-4 mr-3" />
            Account Settings
          </Button>
          
          <Button variant="outline" className="w-full justify-start h-12" onClick={() => setShowPrivacySecurity(true)}>
            <Shield className="w-4 h-4 mr-3" />
            Privacy & Security
          </Button>
          
          <Button variant="outline" className="w-full justify-start h-12" onClick={() => setShowHelpSupport(true)}>
            <HelpCircle className="w-4 h-4 mr-3" />
            Help & Support
          </Button>
          
          <Separator className="my-4" />
          
          <Button 
            variant="outline" 
            className="w-full justify-start h-12 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={onSignOut}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>

        {/* App Version */}
        <div className="text-center text-sm text-muted-foreground py-4">
          CheckMate v1.0.0
        </div>
        
        <EditProfileDialog 
          open={showEditProfile} 
          onOpenChange={setShowEditProfile} 
        />
        <AccountSettingsDialog 
          open={showAccountSettings} 
          onOpenChange={setShowAccountSettings} 
        />
        <PrivacySecurityDialog 
          open={showPrivacySecurity} 
          onOpenChange={setShowPrivacySecurity} 
        />
        <HelpSupportDialog 
          open={showHelpSupport} 
          onOpenChange={setShowHelpSupport} 
        />
      </div>
    </div>
  );
};