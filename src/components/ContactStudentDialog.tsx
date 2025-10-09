import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MessageSquare } from "lucide-react";

interface ContactStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
}

export const ContactStudentDialog = ({ open, onOpenChange, studentName }: ContactStudentDialogProps) => {
  const { toast } = useToast();

  const handleContact = (method: string) => {
    toast({
      title: `${method} Sent`,
      description: `Contacted ${studentName} successfully.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Student</DialogTitle>
          <DialogDescription>Send a message to {studentName}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-3 gap-1"
                onClick={() => handleContact("Email")}
              >
                <Mail className="w-4 h-4" />
                <span className="text-xs">Email</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-3 gap-1"
                onClick={() => handleContact("SMS")}
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs">SMS</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col h-auto py-3 gap-1"
                onClick={() => handleContact("Message")}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">Message</span>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-reason">Reason</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Concern</SelectItem>
                  <SelectItem value="performance">Academic Performance</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="meeting">Schedule Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => handleContact("Message")} className="flex-1">
              Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
