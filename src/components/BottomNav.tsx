import { Home, BookOpen, Calendar, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const BottomNav = ({ activeTab = "home", onTabChange }: BottomNavProps) => {
  const { user } = useAuth();
  
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "classes", label: "Classes", icon: BookOpen },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3, teacherOnly: true },
    { id: "profile", label: "Profile", icon: User },
  ];

  // Filter out teacher-only items for students
  const filteredNavItems = navItems.filter(item => 
    !item.teacherOnly || user?.role === 'teacher'
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {filteredNavItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange?.(id)}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-colors min-w-0 flex-1",
              activeTab === id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};