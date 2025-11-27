import { AnalyticsView } from "@/components/AnalyticsView";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect students to home page
    if (user && user.role === 'student') {
      navigate('/home');
    }
  }, [user, navigate]);

  // Show access denied for students
  if (user && user.role === 'student') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Analytics is only available for teachers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show analytics only for teachers
  return <AnalyticsView />;
};

export default Analytics;
