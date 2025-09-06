import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, MapPin, Users, Filter } from "lucide-react";

export const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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
      class: "PHYS150"
    },
    {
      id: 3,
      title: "Math Assignment Due",
      date: "2024-03-16",
      time: "11:59 PM",
      location: "Online",
      type: "deadline",
      class: "MATH201"
    },
  ];

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
          <Button variant="secondary" size="sm">
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
                      <Badge 
                        variant={
                          event.type === 'exam' ? 'destructive' : 
                          event.type === 'deadline' ? 'secondary' : 'default'
                        }
                        className="text-xs"
                      >
                        {event.type}
                      </Badge>
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
    </div>
  );
};