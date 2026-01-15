import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, Clock, Users, Loader2, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { Link } from "wouter";
import type { BoxingClass } from "@shared/schema";

interface MemberData {
  id: string;
  name: string;
}

export default function Sessions() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);

  const { data: classes, isLoading } = useQuery<BoxingClass[]>({
    queryKey: ["/api/classes"],
  });

  const { data: currentMember } = useQuery<MemberData>({
    queryKey: ["/api/members/me"],
    retry: false,
  });

  const bookMutation = useMutation({
    mutationFn: async (classId: string) => {
      setBookingClassId(classId);
      const res = await apiRequest("POST", `/api/classes/${classId}/book`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/bookings"] });
      toast({ title: "Booking confirmed!", description: "You've successfully booked this class." });
      setBookingClassId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Unable to book class",
        variant: "destructive",
      });
      setBookingClassId(null);
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  // Group classes by date
  const classesByDate = (classes || []).reduce((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {} as Record<string, BoxingClass[]>);

  const classesForSelectedDate = selectedDate
    ? classesByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (classesByDate[dateStr] && !isBefore(date, startOfDay(new Date()))) {
      setSelectedDate(date);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-1/3 mb-8" />
            <Skeleton className="h-[600px]" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead title="Book a Class - Milltown Boxing Club" description="Select a date and time to book your boxing class at Milltown Boxing Club." />

      <section className="bg-foreground py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight" data-testid="text-sessions-title">
            Class Schedule
          </h1>
          <p className="mt-2 text-gray-300">
            View our weekly schedule and book your sessions. All classes are £15 each.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          
          {/* Calendar Header */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={prevMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <h2 className="text-xl font-bold text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button variant="outline" onClick={nextMonth} data-testid="button-next-month">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2 hidden sm:block">
                {day}
              </div>
            ))}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={`short-${day}`} className="text-center text-sm font-semibold text-muted-foreground py-2 sm:hidden">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[100px] sm:min-h-[120px]" />
            ))}
            {daysInMonth.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayClasses = classesByDate[dateStr] || [];
              const hasClass = dayClasses.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isPast = isBefore(day, startOfDay(new Date()));
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(day)}
                  disabled={!hasClass || isPast}
                  className={`
                    min-h-[100px] sm:min-h-[120px] p-2 rounded-lg border text-left transition-all flex flex-col
                    ${isSelected ? "bg-primary/10 border-primary ring-2 ring-primary" : "border-border"}
                    ${!isSelected && hasClass && !isPast ? "hover:border-primary/50 hover:bg-muted/50 cursor-pointer" : ""}
                    ${isPast ? "opacity-50 cursor-default" : ""}
                    ${isCurrentDay && !isSelected ? "border-primary/50" : ""}
                  `}
                  data-testid={`calendar-day-${dateStr}`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isCurrentDay ? "text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  
                  {hasClass && !isPast && (
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayClasses.slice(0, 3).map(c => (
                        <div 
                          key={c.id} 
                          className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 truncate"
                        >
                          <span className="font-medium">{c.time}</span>
                          <span className="hidden sm:inline"> - {c.title}</span>
                        </div>
                      ))}
                      {dayClasses.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayClasses.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-primary bg-primary/10" />
              <span>Selected Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">10:00</div>
              <span>Available Session</span>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <Card className="mt-8 p-6" data-testid="selected-date-panel">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {classesForSelectedDate.length} class{classesForSelectedDate.length !== 1 ? "es" : ""} available
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                  Close
                </Button>
              </div>

              {classesForSelectedDate.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No classes available on this date.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {classesForSelectedDate.map(boxingClass => {
                    const spotsLeft = (boxingClass.capacity || 12) - (boxingClass.bookedCount || 0);
                    const isFull = spotsLeft <= 0;
                    const isBooking = bookingClassId === boxingClass.id;

                    return (
                      <Card
                        key={boxingClass.id}
                        className="p-4 border-2 hover:border-primary/30 transition-colors"
                        data-testid={`timeslot-${boxingClass.id}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-bold text-foreground">{boxingClass.time}</span>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {boxingClass.duration} min
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-2">{boxingClass.title}</h3>
                        
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {spotsLeft} spots left
                          </span>
                          <span className="font-bold text-primary">£{boxingClass.price}</span>
                        </div>

                        {currentMember ? (
                          <Button
                            className="w-full"
                            onClick={() => bookMutation.mutate(boxingClass.id)}
                            disabled={isFull || isBooking}
                            data-testid={`button-book-${boxingClass.id}`}
                          >
                            {isBooking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isFull ? (
                              "Class Full"
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Book Now
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button asChild className="w-full" data-testid={`button-login-${boxingClass.id}`}>
                            <Link href="/login">Login to Book</Link>
                          </Button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {!selectedDate && (
            <Card className="mt-8 p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Select a Date</h3>
              <p className="text-muted-foreground mt-2">
                Click on a date with available classes to view session times and book.
              </p>
            </Card>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
