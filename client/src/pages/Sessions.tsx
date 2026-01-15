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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
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

  const datesWithClasses = new Set(
    classes?.map(c => c.date) || []
  );

  const classesForSelectedDate = selectedDate
    ? classes?.filter(c => c.date === format(selectedDate, "yyyy-MM-dd")) || []
    : [];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (datesWithClasses.has(dateStr) && !isBefore(date, startOfDay(new Date()))) {
      setSelectedDate(date);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-1/3 mb-8" />
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
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
            Book a Class
          </h1>
          <p className="mt-2 text-gray-300">
            Select a date to view available sessions. All classes are £15 per session.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Calendar */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Select a Date</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth} data-testid="button-prev-month">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[140px] text-center font-medium">
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {daysInMonth.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const hasClass = datesWithClasses.has(dateStr);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isPast = isBefore(day, startOfDay(new Date()));
                  const isCurrentDay = isToday(day);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDateClick(day)}
                      disabled={!hasClass || isPast}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-md text-sm transition-colors
                        ${isSelected ? "bg-primary text-white font-bold" : ""}
                        ${!isSelected && hasClass && !isPast ? "bg-primary/10 text-primary font-semibold hover:bg-primary/20 cursor-pointer" : ""}
                        ${!hasClass || isPast ? "text-muted-foreground/50 cursor-default" : ""}
                        ${isCurrentDay && !isSelected ? "ring-2 ring-primary ring-offset-2" : ""}
                      `}
                      data-testid={`calendar-day-${dateStr}`}
                    >
                      {format(day, "d")}
                      {hasClass && !isPast && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-primary"}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary/20" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span>Selected</span>
                </div>
              </div>
            </Card>

            {/* Time slots */}
            <Card className="p-6">
              {selectedDate ? (
                <>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Select a time slot to book
                  </p>

                  {classesForSelectedDate.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No classes available on this date.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {classesForSelectedDate.map(boxingClass => {
                        const spotsLeft = (boxingClass.capacity || 12) - (boxingClass.bookedCount || 0);
                        const isFull = spotsLeft <= 0;
                        const isBooking = bookingClassId === boxingClass.id;

                        return (
                          <div
                            key={boxingClass.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            data-testid={`timeslot-${boxingClass.id}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                                  <Clock className="h-4 w-4 text-primary" />
                                  {boxingClass.time}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {boxingClass.duration} min
                                </Badge>
                              </div>
                              <p className="mt-1 font-medium text-foreground">{boxingClass.title}</p>
                              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  {spotsLeft} spots left
                                </span>
                                <span className="font-semibold text-primary">£{boxingClass.price}</span>
                              </div>
                            </div>

                            <div className="ml-4">
                              {currentMember ? (
                                <Button
                                  onClick={() => bookMutation.mutate(boxingClass.id)}
                                  disabled={isFull || isBooking}
                                  size="sm"
                                  data-testid={`button-book-${boxingClass.id}`}
                                >
                                  {isBooking ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isFull ? (
                                    "Full"
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Book
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button asChild size="sm" data-testid={`button-login-${boxingClass.id}`}>
                                  <Link href="/login">Login</Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Select a Date</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Choose a date from the calendar to see available class times.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
