import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Users, 
  Calendar, 
  Filter,
  BookOpen,
  Clock
} from "lucide-react";
import { ClassCard } from "./ClassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ClassesViewProps {
  userType?: 'teacher' | 'student';
  onClassSelect?: (classId: string) => void;
  onNewClass?: () => void;
  onJoinClass?: () => void;
}

export const ClassesView = ({ userType = 'teacher', onClassSelect, onNewClass, onJoinClass }: ClassesViewProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch real classes data
  const teacherClasses = useQuery(
    api.classes.getTeacherClasses,
    user?.role === 'teacher' && user ? { teacherId: user.userId } : "skip"
  );

  const studentClasses = useQuery(
    api.classes.getStudentClasses,
    user?.role === 'student' && user ? { studentId: user.userId } : "skip"
  );

  const allClasses = userType === 'teacher' ? teacherClasses : studentClasses;

  const filteredClasses = (allClasses || []).filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         cls.code.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, all classes are "active" since we don't have status in the schema yet
    return matchesSearch;
  });

  const totalStudents = (allClasses || []).reduce((sum, c) => sum + (c.studentCount || 0), 0);

  if (!user) {
    return null;
  }

  if (!allClasses) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading classes...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case "upcoming":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case "archived":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {userType === 'teacher' ? 'My Classes' : 'Enrolled Classes'}
            </h1>
            <p className="text-primary-foreground/80 mt-1">
              {userType === 'teacher' ? 'Manage your classes' : 'View your enrolled classes'}
            </p>
          </div>
          {userType === 'teacher' ? (
            <Button variant="secondary" onClick={onNewClass}>
              <Plus className="w-4 h-4 mr-2" />
              New Class
            </Button>
          ) : (
            <Button variant="secondary" onClick={onJoinClass}>
              <Plus className="w-4 h-4 mr-2" />
              Join Class
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-foreground/60" />
          <Input 
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {allClasses.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {allClasses.length === 1 ? 'Class' : 'Classes'}
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {totalStudents}
            </div>
            <div className="text-sm text-muted-foreground">
              {userType === 'teacher' ? 'Total Students' : 'Classmates'}
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {allClasses.length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </Card>
        </div>

        {/* Classes List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {filteredClasses.length} {filteredClasses.length === 1 ? 'Class' : 'Classes'}
            </h2>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {filteredClasses.length > 0 ? (
            <div className="space-y-4">
              {filteredClasses.map((classItem) => (
                <Card key={classItem._id} className="p-4 shadow-card hover:shadow-soft transition-all cursor-pointer"
                      onClick={() => onClassSelect?.(classItem._id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{classItem.description || classItem.name}</h3>
                        <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {classItem.name}{classItem.schedule && ` • ${classItem.schedule}`}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {classItem.studentCount || 0} students
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <Button variant="ghost" size="sm">
                      <BookOpen className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No classes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms or filters"
                  : userType === 'teacher' 
                    ? "Create your first class to get started"
                    : "Join your first class to get started"
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={userType === 'teacher' ? onNewClass : onJoinClass}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {userType === 'teacher' ? 'Create Class' : 'Join Class'}
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};