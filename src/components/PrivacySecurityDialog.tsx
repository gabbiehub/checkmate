import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface PrivacySecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacySecurityDialog = ({ open, onOpenChange }: PrivacySecurityDialogProps) => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Privacy Settings Updated",
      description: "Your privacy preferences have been saved.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy & Security</DialogTitle>
          <DialogDescription>Control your privacy and data sharing preferences</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Profile Privacy</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="profile-visibility">Profile Visible to Students</Label>
              <Switch id="profile-visibility" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="contact-visibility">Show Contact Information</Label>
              <Switch id="contact-visibility" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="office-hours">Display Office Hours</Label>
              <Switch id="office-hours" defaultChecked />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Data Management</h3>
            <Button variant="outline" className="w-full justify-start">
              Download My Data
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
              Delete All Data
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
