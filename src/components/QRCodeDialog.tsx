import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      if (classData?.code && open) {
        try {
          console.log('Generating QR code for:', classData.code);
          const url = await QRCode.toDataURL(classData.code, {
            width: 192,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(url);
          console.log('QR code generated successfully');
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      }
    };
    
    generateQR();
  }, [classData?.code, open]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classData?.code || "MATH101");
    toast({
      title: "Code Copied",
      description: "Class code has been copied to clipboard.",
    });
  };

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `${classData?.name || 'class'}-qrcode.png`;
      link.href = qrCodeUrl;
      link.click();
      toast({
        title: "QR Code Downloaded",
        description: "QR code has been saved to your downloads.",
      });
    }
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
          <Card className="p-6 bg-white flex items-center justify-center">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                Loading QR Code...
              </div>
            )}
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