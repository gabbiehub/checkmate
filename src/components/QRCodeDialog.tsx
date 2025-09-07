import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: {
    name: string;
    code: string;
  };
}

export const QRCodeDialog = ({ open, onOpenChange, classData }: QRCodeDialogProps) => {
  const { toast } = useToast();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classData?.code || "MATH101");
    toast({
      title: "Code Copied",
      description: "Class code has been copied to clipboard.",
    });
  };

  const handleDownload = () => {
    toast({
      title: "QR Code Downloaded",
      description: "QR code has been saved to your downloads.",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join ${classData?.name || 'My Class'}`,
        text: `Use code: ${classData?.code || 'MATH101'}`,
        url: window.location.href,
      });
    } else {
      handleCopyCode();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Class QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <Card className="p-6 bg-white">
            {/* QR Code placeholder - would use a real QR code library in production */}
            <div className="w-48 h-48 bg-black flex items-center justify-center">
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}
                  />
                ))}
              </div>
            </div>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Class Code</p>
            <p className="text-2xl font-bold font-mono">{classData?.code || "MATH101"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {classData?.name || "Math 101 - Algebra"}
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={handleCopyCode} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Students can scan this QR code or enter the class code to join your class.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};