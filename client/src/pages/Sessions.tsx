import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, Clock, Users, Loader2, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { Link } from "wouter";
import type { BoxingClass } from "@shared/schema";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "";

interface MemberData {
  id: string;
  name: string;
  hasUsedFreeSession?: boolean;
}

export default function Sessions() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);
  const [captchaDialogOpen, setCaptchaDialogOpen] = useState(false);
  const [pendingBookingClassId, setPendingBookingClassId] = useState<string | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const { data: classes, isLoading } = useQuery<BoxingClass[]>({
    queryKey: ["/api/classes"],
  });

  const { data: currentMember } = useQuery<MemberData>({
    queryKey: ["/api/members/me"],
    retry: false,
  });

  const handleBookClick = (classId: string) => {
    if (HCAPTCHA_SITE_KEY) {
      setPendingBookingClassId(classId);
      setCaptchaDialogOpen(true);
    } else {
      bookMutation.mutate(classId);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setHcaptchaToken(token);
  };

  const confirmBookingWithCaptcha = () => {
    if (pendingBookingClassId && hcaptchaToken) {
      bookMutation.mutate(pendingBookingClassId);
      setCaptchaDialogOpen(false);
      setHcaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
  };

  const bookMutation = useMutation({
    mutationFn: async (classId: string) => {
      setBookingClassId(classId);
      const res = await apiRequest("POST", `/api/classes/${classId}/book`, {
        hcaptchaToken,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      toast({ 
        title: data.isFreeSession ? "Free Session Booked!" : "Booking confirmed!", 
        description: data.message || "You've successfully booked this class."
      });
      setBookingClassId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Unable to book class",
        variant: "destructive",
      });
      setBookingClassId(null);
      setPendingBookingClassId(null);
      setHcaptchaToken(null);
      captchaRef.current?.resetCaptcha();
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
      <SEOHead title="Book a Class - Mill Town ABC" description="Select a date and time to book your boxing class at Mill Town ABC in Glossop. All sessions £5. First session FREE!" />

      <section className="bg-foreground py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight" data-testid="text-sessions-title">
            Class Schedule
          </h1>
          <p className="mt-2 text-gray-300">
            View our weekly schedule and book your sessions. All classes are £5 each. First session FREE!
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Free Session Banner */}
          {currentMember && !currentMember.hasUsedFreeSession && (
            <Card className="p-4 mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" data-testid="banner-free-session">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-green-600" data-testid="badge-free-intro">
                  FREE
                </Badge>
                <div>
                  <p className="font-bold text-green-800 dark:text-green-200" data-testid="text-free-session-title">
                    Your first session is FREE, then £5 per session
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300" data-testid="text-free-session-desc">
                    Book any class below - your first session costs £0. All subsequent sessions are just £5.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Cancellation Policy Notice */}
          <Card className="p-4 mb-6 bg-muted/50" data-testid="card-cancellation-policy">
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Cancellation Policy</p>
              <p>
                Cancel more than 1 hour before your session and we'll restore your free session or refund your payment. 
                Cancellations within 1 hour of the session start time will forfeit your free session or payment.
              </p>
            </div>
          </Card>
          
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
                      {/* Mobile: Show count badge */}
                      <div className="sm:hidden">
                        <div className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {dayClasses.length}
                        </div>
                      </div>
                      {/* Desktop: Show class times */}
                      <div className="hidden sm:block space-y-1">
                        {dayClasses.slice(0, 3).map(c => (
                          <div 
                            key={c.id} 
                            className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 truncate"
                          >
                            <span className="font-medium">{c.time}</span>
                            <span className="hidden lg:inline"> - {c.title}</span>
                          </div>
                        ))}
                        {dayClasses.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayClasses.length - 3} more
                          </div>
                        )}
                      </div>
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
            <div className="flex items-center gap-2 sm:hidden">
              <div className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">2</div>
              <span>Number of classes</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">10:00</div>
              <span>Available Session</span>
            </div>
          </div>

          {/* Mobile: Upcoming Sessions List */}
          <div className="sm:hidden mt-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Upcoming Sessions</h2>
            <div className="space-y-3">
              {(classes || [])
                .filter(c => !isBefore(new Date(c.date), startOfDay(new Date())))
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .slice(0, 10)
                .map(boxingClass => {
                  const classDate = new Date(boxingClass.date + "T12:00:00");
                  const spotsLeft = (boxingClass.capacity || 12) - (boxingClass.bookedCount || 0);
                  
                  return (
                    <Card 
                      key={boxingClass.id} 
                      className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedDate(classDate)}
                      data-testid={`mobile-session-${boxingClass.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs font-semibold">
                              {format(classDate, "EEE, MMM d")}
                            </Badge>
                            <span className="text-sm font-bold text-primary">{boxingClass.time}</span>
                          </div>
                          <h3 className="font-semibold text-foreground">{boxingClass.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span>{boxingClass.duration} min</span>
                            <span>{spotsLeft} spots</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {currentMember && !currentMember.hasUsedFreeSession ? (
                            <Badge variant="default" className="bg-green-600">FREE</Badge>
                          ) : (
                            <div className="font-bold text-primary">£5</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
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
                    const isEligibleForFree = currentMember && !currentMember.hasUsedFreeSession;

                    return (
                      <Card
                        key={boxingClass.id}
                        className={`p-4 border-2 hover:border-primary/30 transition-colors ${isEligibleForFree ? 'ring-2 ring-green-500/30' : ''}`}
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
                          {isEligibleForFree ? (
                            <Badge variant="default" className="bg-green-600" data-testid={`badge-free-${boxingClass.id}`}>
                              FREE
                            </Badge>
                          ) : (
                            <span className="font-bold text-primary" data-testid={`text-price-${boxingClass.id}`}>£5</span>
                          )}
                        </div>

                        {currentMember ? (
                          <Button
                            className={`w-full ${isEligibleForFree ? 'bg-green-600' : ''}`}
                            onClick={() => handleBookClick(boxingClass.id)}
                            disabled={isFull || isBooking}
                            data-testid={`button-book-${boxingClass.id}`}
                          >
                            {isBooking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isFull ? (
                              "Class Full"
                            ) : isEligibleForFree ? (
                              <span data-testid={`text-book-free-${boxingClass.id}`}>
                                <Check className="h-4 w-4 mr-2 inline" />
                                Book Free First Session
                              </span>
                            ) : (
                              <span data-testid={`text-book-paid-${boxingClass.id}`}>
                                <Check className="h-4 w-4 mr-2 inline" />
                                Pay £5 with Square
                              </span>
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

      {/* hCaptcha Dialog for Booking */}
      <Dialog open={captchaDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCaptchaDialogOpen(false);
          setPendingBookingClassId(null);
          setHcaptchaToken(null);
          captchaRef.current?.resetCaptcha();
        }
      }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-captcha-booking">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Please verify you're human to complete your booking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <HCaptcha
              ref={captchaRef}
              sitekey={HCAPTCHA_SITE_KEY}
              onVerify={handleCaptchaVerify}
              onExpire={() => setHcaptchaToken(null)}
              onError={() => setHcaptchaToken(null)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCaptchaDialogOpen(false);
                setPendingBookingClassId(null);
                setHcaptchaToken(null);
                captchaRef.current?.resetCaptcha();
              }}
              data-testid="button-captcha-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBookingWithCaptcha}
              disabled={!hcaptchaToken || bookMutation.isPending}
              data-testid="button-captcha-confirm"
            >
              {bookMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
