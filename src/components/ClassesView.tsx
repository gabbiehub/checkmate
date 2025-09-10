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

interface ClassesViewProps {
  userType?: 'teacher' | 'student';
  onClassSelect?: (classId: string) => void;
  onNewClass?: () => void;
  onJoinClass?: () => void;
}

export const ClassesView = ({ userType = 'teacher', onClassSelect, onNewClass, onJoinClass }: ClassesViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Mock classes data
  const allClasses = [
    { id: 1, name: "Computer Science 101", code: "CS101", students: 45, attendance: 89, status: "active", schedule: "MWF 10:00 AM" },
    { id: 2, name: "Advanced Mathematics", code: "MATH201", students: 38, attendance: 92, status: "active", schedule: "TTh 2:00 PM" },
    { id: 3, name: "Physics Laboratory", code: "PHYS150", students: 28, attendance: 85, status: "active", schedule: "W 3:00 PM" },
    { id: 4, name: "Data Structures", code: "CS201", students: 32, attendance: 78, status: "upcoming", schedule: "MWF 1:00 PM" },
    { id: 5, name: "Linear Algebra", code: "MATH301", students: 25, attendance: 94, status: "archived", schedule: "TTh 11:00 AM" },
  ];

  const filteredClasses = allClasses.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         cls.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || cls.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
        {/* Filter Tabs */}
        <Card className="p-4 shadow-card">
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {allClasses.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active Classes</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {allClasses.reduce((sum, c) => sum + c.students, 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              {userType === 'teacher' ? 'Total Students' : 'Classmates'}
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {Math.round(allClasses.reduce((sum, c) => sum + c.attendance, 0) / allClasses.length)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Attendance</div>
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
                <Card key={classItem.id} className="p-4 shadow-card hover:shadow-soft transition-all cursor-pointer"
                      onClick={() => onClassSelect?.(classItem.id.toString())}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{classItem.name}</h3>
                        {getStatusBadge(classItem.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{classItem.code}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {classItem.schedule}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {classItem.students} students
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Attendance: </span>
                        <span className={`font-medium ${
                          classItem.attendance >= 90 ? 'text-green-600' : 
                          classItem.attendance >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {classItem.attendance}%
                        </span>
                      </div>
                    </div>
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