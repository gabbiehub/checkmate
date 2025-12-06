import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Type, Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Html5Qrcode } from "html5-qrcode";
import jsQR from "jsqr";

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
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup QR scanner on unmount or dialog close
  useEffect(() => {
    return () => {
      if (qrCodeRef.current) {
        qrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (!open && qrCodeRef.current) {
      qrCodeRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
  }, [open]);

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

  const processScannedCode = async (decodedText: string) => {
    if (!user) return;

    setIsJoining(true);
    
    // Stop scanner if running
    if (qrCodeRef.current && isScanning) {
      try {
        await qrCodeRef.current.stop();
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
      setIsScanning(false);
    }

    try {
      const result = await joinClass({
        code: decodedText.trim().toUpperCase(),
        studentId: user.userId,
      });

      toast({
        title: "Class Joined!",
        description: `Successfully joined ${result.name}`,
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      onClassJoined?.(result._id);
      onOpenChange(false);
      setActiveTab("code");
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

  const startCameraScanning = async () => {
    // Check if we're on HTTPS or localhost
    const isSecureContext = window.isSecureContext;
    
    if (!isSecureContext) {
      toast({
        title: "Camera Unavailable",
        description: "Camera access requires HTTPS. Please use the 'Upload Image' option instead.",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);

    try {
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      qrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          processScannedCode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen continuously while scanning)
        }
      );
    } catch (error) {
      setIsScanning(false);
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions or try uploading an image.",
        variant: "destructive"
      });
    }
  };

  const stopCameraScanning = async () => {
    if (qrCodeRef.current) {
      try {
        await qrCodeRef.current.stop();
        setIsScanning(false);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsJoining(true);
    
    try {
      // Create image element
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Load image
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Draw to canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      // Clean up
      URL.revokeObjectURL(img.src);

      if (code && code.data) {
        await processScannedCode(code.data);
      } else {
        throw new Error('No QR code found in image');
      }
    } catch (error) {
      console.error("File scan error:", error);
      setIsJoining(false);
      toast({
        title: "Scan Error",
        description: "Unable to read QR code from image. Make sure the image contains a clear QR code.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              {isScanning ? (
                <div 
                  id="qr-reader" 
                  className="w-full rounded-lg overflow-hidden bg-black"
                  style={{ minHeight: '300px', maxWidth: '100%' }}
                />
              ) : (
                <div className="w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Scan or upload QR code
                    </p>
                  </div>
                </div>
              )}
              
              {/* Hidden element for file scanning */}
              <div id="qr-reader-file" style={{ display: 'none' }} />
              
              <div className="flex gap-2 w-full">
                {!isScanning ? (
                  <>
                    <Button onClick={startCameraScanning} className="flex-1" disabled={isJoining}>
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
                    </Button>
                    <Button 
                      onClick={() => fileInputRef.current?.click()} 
                      variant="outline" 
                      className="flex-1"
                      disabled={isJoining}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </>
                ) : (
                  <Button onClick={stopCameraScanning} variant="destructive" className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </Button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <p className="text-xs text-muted-foreground text-center">
                Point your camera at the QR code or upload an image
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};