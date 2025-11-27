import { TeacherHome } from "@/components/TeacherHome";
import { StudentHome } from "@/components/StudentHome";
import { ClassView } from "@/components/ClassView";
import { StudentClassView } from "@/components/StudentClassView";
import { NewClassForm } from "@/components/NewClassForm";
import { CalendarView } from "@/components/CalendarView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { ProfileView } from "@/components/ProfileView";
import { ClassesView } from "@/components/ClassesView";
import { BottomNav } from "@/components/BottomNav";
import { AuthPage } from "@/components/AuthPage";
import { JoinClassDialog } from "@/components/JoinClassDialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import { ClassSettingsDialog } from "@/components/ClassSettingsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Index = () => {
  const { user, isLoading: authLoading, logout } = useAuth();
  const isAuthenticated = !!user;
  const userType = user?.role || 'teacher';
  
  const [activeTab, setActiveTab] = useState("home");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showNewClassForm, setShowNewClassForm] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showClassSettings, setShowClassSettings] = useState(false);

  const handleSignOut = () => {
    logout();
    setActiveTab("home");
    setSelectedClass(null);
    setShowNewClassForm(false);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setShowNewClassForm(false);
  };

  const handleBackToHome = () => {
    setSelectedClass(null);
    setActiveTab("home");
    setShowNewClassForm(false);
  };

  const handleNewClass = () => {
    setShowNewClassForm(true);
    setSelectedClass(null);
  };

  const handleBackFromNewClass = () => {
    setShowNewClassForm(false);
  };

  const handleClassCreated = (classId: string) => {
    setShowNewClassForm(false);
    setSelectedClass(classId);
  };

  const renderContent = () => {
    if (showNewClassForm) {
      return <NewClassForm onBack={handleBackFromNewClass} onClassCreated={handleClassCreated} />;
    }

    if (selectedClass) {
      return userType === 'teacher' 
        ? <ClassView classId={selectedClass} onBack={handleBackToHome} />
        : <StudentClassView classId={selectedClass} onBack={handleBackToHome} />;
    }

    switch (activeTab) {
      case "home":
        return userType === 'teacher' 
          ? <TeacherHome 
              onClassSelect={handleClassSelect} 
              onNewClass={handleNewClass}
              onViewAllClasses={() => setActiveTab("classes")}
            />
          : <StudentHome onClassSelect={handleClassSelect} onJoinClass={() => setShowJoinClass(true)} />;
      case "classes":
        return <ClassesView 
          userType={userType}
          onClassSelect={handleClassSelect}
          onNewClass={handleNewClass}
          onJoinClass={() => setShowJoinClass(true)}
        />;
      case "calendar":
        return <CalendarView />;
      case "analytics":
        return <AnalyticsView />;
      case "profile":
        return <ProfileView onSignOut={handleSignOut} />;
      default:
        return userType === 'teacher' 
          ? <TeacherHome 
              onClassSelect={handleClassSelect} 
              onNewClass={handleNewClass}
              onViewAllClasses={() => setActiveTab("classes")}
            />
          : <StudentHome onClassSelect={handleClassSelect} onJoinClass={() => setShowJoinClass(true)} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => { /* Auth handled by context */ }} />;
  }

  return (
    <div className="relative">
      {renderContent()}
      {!selectedClass && !showNewClassForm && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
      
      <JoinClassDialog 
        open={showJoinClass} 
        onOpenChange={setShowJoinClass}
        onClassJoined={handleClassSelect}
      />
      <AddEventDialog 
        open={showAddEvent} 
        onOpenChange={setShowAddEvent}
      />
      <ClassSettingsDialog 
        open={showClassSettings} 
        onOpenChange={setShowClassSettings}
        classId={selectedClass || ""}
      />
    </div>
  );
};

export default Index;
