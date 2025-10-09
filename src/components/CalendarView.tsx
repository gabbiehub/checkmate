import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, MapPin, Users, Filter, Monitor, Users2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddEventDialog } from "@/components/AddEventDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  class: string;
  meetingType?: string;
}

export const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const events = [
    {
      id: 1,
      title: "CS101 Midterm Exam",
      date: "2024-03-15",
      time: "2:00 PM - 4:00 PM",
      location: "Room 301",
      type: "exam",
      class: "CS101"
    },
    {
      id: 2,
      title: "Physics Lab Session",
      date: "2024-03-15",
      time: "4:00 PM - 6:00 PM",
      location: "Physics Lab",
      type: "class",
      meetingType: "face-to-face",
      class: "PHYS150"
    },
    {
      id: 3,
      title: "Math Online Lecture",
      date: "2024-03-15",
      time: "10:00 AM - 11:30 AM",
      location: "Zoom Meeting",
      type: "class",
      meetingType: "online",
      class: "MATH201"
    },
    {
      id: 4,
      title: "History Self-Study",
      date: "2024-03-15",
      time: "All Day",
      location: "Canvas Platform",
      type: "class",
      meetingType: "asynchronous",
      class: "HIST101"
    },
    {
      id: 5,
      title: "Math Assignment Due",
      date: "2024-03-16",
      time: "11:59 PM",
      location: "Online",
      type: "deadline",
      class: "MATH201"
    },
  ];

  const getMeetingTypeIcon = (meetingType?: string) => {
    switch (meetingType) {
      case "face-to-face":
        return <Users2 className="w-3 h-3" />;
      case "online":
        return <Monitor className="w-3 h-3" />;
      case "asynchronous":
        return <BookOpen className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getMeetingTypeColor = (meetingType?: string) => {
    switch (meetingType) {
      case "face-to-face":
        return "bg-green-100 text-green-800 border-green-200";
      case "online":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "asynchronous":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "";
    }
  };

  const todaysEvents = events.filter(event => event.date === "2024-03-15");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-primary-foreground/80">Manage your schedule</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setIsAddEventOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap">
            <Filter className="w-3 h-3 mr-1" />
            All Events
          </Button>
          <Badge variant="outline" className="border-white/20 text-white bg-white/10">Classes</Badge>
          <Badge variant="outline" className="border-white/20 text-white bg-white/10">Exams</Badge>
          <Badge variant="outline" className="border-white/20 text-white bg-white/10">Deadlines</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 space-y-6">
        {/* Calendar Widget */}
        <Card className="p-4 shadow-card">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md"
          />
        </Card>

        {/* Today's Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Today's Events</h2>
            <p className="text-sm text-muted-foreground">March 15, 2024</p>
          </div>
          
          <div className="space-y-3">
            {todaysEvents.map((event) => (
              <Card key={event.id} className="p-4 shadow-card border-l-4 border-l-primary">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-foreground">{event.title}</h3>
                      <div className="flex gap-1">
                        <Badge 
                          variant={
                            event.type === 'exam' ? 'destructive' : 
                            event.type === 'deadline' ? 'secondary' : 'default'
                          }
                          className="text-xs"
                        >
                          {event.type}
                        </Badge>
                        {event.meetingType && (
                          <Badge 
                            className={cn("text-xs flex items-center gap-1", getMeetingTypeColor(event.meetingType))}
                            variant="outline"
                          >
                            {getMeetingTypeIcon(event.meetingType)}
                            {event.meetingType === "face-to-face" ? "In-Person" : 
                             event.meetingType === "online" ? "Online" : "Async"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        <span>{event.class}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedEvent(event)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h2>
          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Math Assignment Due</h3>
                <p className="text-sm text-muted-foreground">Tomorrow • 11:59 PM • MATH201</p>
              </div>
              <Badge variant="secondary">Deadline</Badge>
            </div>
          </Card>
        </div>

        {/* Weekly View Toggle */}
        <div className="flex justify-center">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button variant="ghost" size="sm" className="bg-primary text-primary-foreground">
              Month
            </Button>
            <Button variant="ghost" size="sm">
              Week
            </Button>
            <Button variant="ghost" size="sm">
              Day
            </Button>
          </div>
        </div>
      </div>

      <AddEventDialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen} />
      
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Event details and information</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge 
                  variant={
                    selectedEvent.type === 'exam' ? 'destructive' : 
                    selectedEvent.type === 'deadline' ? 'secondary' : 'default'
                  }
                >
                  {selectedEvent.type}
                </Badge>
                {selectedEvent.meetingType && (
                  <Badge 
                    className={cn("flex items-center gap-1", getMeetingTypeColor(selectedEvent.meetingType))}
                    variant="outline"
                  >
                    {getMeetingTypeIcon(selectedEvent.meetingType)}
                    {selectedEvent.meetingType === "face-to-face" ? "In-Person" : 
                     selectedEvent.meetingType === "online" ? "Online" : "Async"}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.class}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};