import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, MapPin, Users, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddEventDialog } from "@/components/AddEventDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format, parseISO } from "date-fns";

interface Event {
  _id: string;
  title: string;
  date: string;
  description?: string;
  className: string;
  classId: string;
  createdBy: string;
  createdAt: number;
  eventType?: "exam" | "activity" | "class" | "deadline" | "other";
  classType?: "in-person" | "online" | "async";
  time?: string;
  isPersonal: boolean;
}

export const CalendarView = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Fetch all events for the user
  const events = useQuery(
    api.eventsAndReminders.getUserEvents,
    user ? { userId: user.userId } : "skip"
  );

  // Get dates that have events for highlighting
  const eventDates = useMemo(() => {
    if (!events) return new Set<string>();
    return new Set(events.map((event) => event.date));
  }, [events]);

  // Filter events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!events || !selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return events.filter((event) => event.date === dateStr);
  }, [events, selectedDate]);

  // Get today's events
  const todaysEvents = useMemo(() => {
    if (!events) return [];
    const today = format(new Date(), 'yyyy-MM-dd');
    return events.filter((event) => event.date === today);
  }, [events]);

  // Get upcoming events (next 7 days, excluding today)
  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const todayStr = format(today, 'yyyy-MM-dd');
    const nextWeekStr = format(nextWeek, 'yyyy-MM-dd');
    
    return events
      .filter((event) => event.date > todayStr && event.date <= nextWeekStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5); // Show only top 5 upcoming
  }, [events]);

  // Get events based on view mode
  const viewModeEvents = useMemo(() => {
    if (!events || !selectedDate) return [];
    
    switch (viewMode) {
      case 'day':
        // Show only the selected day
        const dayStr = format(selectedDate, 'yyyy-MM-dd');
        return events.filter((event) => event.date === dayStr);
      
      case 'week':
        // Show events for the week containing the selected date
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const startStr = format(startOfWeek, 'yyyy-MM-dd');
        const endStr = format(endOfWeek, 'yyyy-MM-dd');
        
        return events
          .filter((event) => event.date >= startStr && event.date <= endStr)
          .sort((a, b) => a.date.localeCompare(b.date));
      
      case 'month':
        // Show events for the month containing the selected date
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        const monthStartStr = format(startOfMonth, 'yyyy-MM-dd');
        const monthEndStr = format(endOfMonth, 'yyyy-MM-dd');
        
        return events
          .filter((event) => event.date >= monthStartStr && event.date <= monthEndStr)
          .sort((a, b) => a.date.localeCompare(b.date));
      
      default:
        return [];
    }
  }, [events, selectedDate, viewMode]);

  // Custom day renderer to highlight dates with events
  const modifiers = {
    hasEvent: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return eventDates.has(dateStr);
    },
  };

  const modifiersClassNames = {
    hasEvent: "font-bold underline decoration-2",
  };

  if (!user) {
    return null;
  }

  const displayDate = selectedDate || new Date();
  
  // Dynamic header based on view mode
  let viewModeTitle = '';
  let formattedDisplayDate = '';
  
  switch (viewMode) {
    case 'day':
      viewModeTitle = 'Day View';
      formattedDisplayDate = format(displayDate, 'MMMM d, yyyy');
      break;
    case 'week':
      viewModeTitle = 'Week View';
      const startOfWeek = new Date(displayDate);
      startOfWeek.setDate(displayDate.getDate() - displayDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      formattedDisplayDate = `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
      break;
    case 'month':
      viewModeTitle = 'Month View';
      formattedDisplayDate = format(displayDate, 'MMMM yyyy');
      break;
  }
  
  const eventsToShow = viewModeEvents;

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
        <Card className="p-4 shadow-card flex flex-col items-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md mx-auto"
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground text-center">
            {eventDates.size > 0 ? (
              <p><span className="font-semibold text-primary">Underlined dates</span> have scheduled events</p>
            ) : (
              <p>No events scheduled yet</p>
            )}
          </div>
        </Card>

        {/* Selected Date Events or Today's Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {viewModeTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{formattedDisplayDate}</p>
          </div>
          
          {eventsToShow.length === 0 ? (
            <Card className="p-6 shadow-card text-center">
              <p className="text-muted-foreground">No events scheduled for this date</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {eventsToShow.map((event) => (
                <Card key={event._id} className="p-4 shadow-card border-l-4 border-l-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <Badge variant="default" className="text-xs">
                          {event.eventType || "event"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{format(parseISO(event.date), 'MMMM d, yyyy')}</span>
                          {event.time && (
                            <span className="text-xs">• {event.time}</span>
                          )}
                        </div>
                        {event.description && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{event.description}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <span>{event.className}</span>
                          {event.classType && (
                            <Badge variant="outline" className="text-xs">
                              {event.classType === "in-person" ? "In-Person" : 
                               event.classType === "online" ? "Online" : 
                               "Async"}
                            </Badge>
                          )}
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
          )}
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Card key={event._id} className="p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {event.eventType || "event"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(parseISO(event.date), 'MMM d, yyyy')}</span>
                        {event.time && <span>• {event.time}</span>}
                        <span>• {event.className}</span>
                        {event.classType && (
                          <Badge variant="outline" className="text-xs">
                            {event.classType === "in-person" ? "In-Person" : 
                             event.classType === "online" ? "Online" : 
                             "Async"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedEvent(event)}
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Weekly View Toggle */}
        <div className="flex justify-center">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                viewMode === 'month' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                viewMode === 'week' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                viewMode === 'day' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={() => setViewMode('day')}
            >
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
              <div className="flex items-center gap-2">
                <Badge variant="default">{selectedEvent.eventType || "event"}</Badge>
                {selectedEvent.classType && (
                  <Badge variant="outline">
                    {selectedEvent.classType === "in-person" ? "In-Person" : 
                     selectedEvent.classType === "online" ? "Online" : 
                     "Async"}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{format(parseISO(selectedEvent.date), 'MMMM d, yyyy')}</span>
                  {selectedEvent.time && <span className="text-muted-foreground">• {selectedEvent.time}</span>}
                </div>
                {selectedEvent.description && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{selectedEvent.description}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.className}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};