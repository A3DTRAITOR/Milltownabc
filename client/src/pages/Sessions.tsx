import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight, Clock, Loader2, Check, CreditCard, Banknote } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday, isBefore, startOfDay, addDays } from "date-fns";
import { Link } from "wouter";
import type { BoxingClass } from "@shared/schema";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { SquarePayment } from "@/components/SquarePayment";

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "";

interface MemberData {
  id: string;
  name: string;
  hasUsedFreeSession?: boolean;
}

export default function Sessions() {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);
  const [captchaDialogOpen, setCaptchaDialogOpen] = useState(false);
  const [pendingBookingClassId, setPendingBookingClassId] = useState<string | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentClassId, setPaymentClassId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");

  const { data: classes, isLoading } = useQuery<BoxingClass[]>({
    queryKey: ["/api/classes"],
  });

  const { data: currentMember } = useQuery<MemberData>({
    queryKey: ["/api/members/me"],
    retry: false,
  });

  const handleBookClick = (classId: string, isFreeSession: boolean) => {
    if (isFreeSession) {
      if (HCAPTCHA_SITE_KEY) {
        setPendingBookingClassId(classId);
        setCaptchaDialogOpen(true);
      } else {
        bookMutation.mutate(classId);
      }
    } else {
      setPaymentClassId(classId);
      setPaymentDialogOpen(true);
    }
  };

  const handlePaymentSuccess = async (paymentToken: string, verificationToken?: string) => {
    if (!paymentClassId) return;
    
    setIsProcessingPayment(true);
    try {
      const res = await apiRequest("POST", `/api/classes/${paymentClassId}/book`, {
        paymentToken,
        verificationToken,
        hcaptchaToken: null,
      });
      const data = await res.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      
      toast({ 
        title: "Payment successful!", 
        description: "Your session has been booked."
      });
      
      setPaymentDialogOpen(false);
      setPaymentClassId(null);
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message || "Payment processed but booking failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleCashBooking = async () => {
    if (!paymentClassId) return;
    
    setIsProcessingPayment(true);
    try {
      const res = await apiRequest("POST", `/api/classes/${paymentClassId}/book`, {
        paymentMethod: "cash",
        hcaptchaToken: null,
      });
      const data = await res.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      
      toast({ 
        title: "Session booked!", 
        description: "Pay £5 cash when you arrive at reception."
      });
      
      setPaymentDialogOpen(false);
      setPaymentClassId(null);
      setPaymentMethod("card");
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message || "Unable to book session",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
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

  const weekEnd = addDays(weekStart, 13);
  const twoWeeksDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group classes by date
  const classesByDate = (classes || []).reduce((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {} as Record<string, BoxingClass[]>);

  const classesForSelectedDate = selectedDate
    ? classesByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
  const maxWeekStart = addWeeks(currentWeekStart, 1);

  const prevWeek = () => {
    if (weekStart > currentWeekStart) {
      setWeekStart(subWeeks(weekStart, 1));
    }
  };
  const nextWeek = () => {
    if (weekStart < maxWeekStart) {
      setWeekStart(addWeeks(weekStart, 1));
    }
  };

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
      <SEOHead title="Book Boxing Classes in Glossop - Mill Town ABC | £5 Per Session" description="Book boxing classes at Mill Town ABC, Whitfield Community Centre, Glossop. Monday, Wednesday and Saturday sessions available. All classes £5. First session FREE!" />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Book a Class", url: "/sessions" }]} />

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
              <p className="font-semibold text-foreground mb-1">Cancellation & Refund Policy</p>
              <p>
                Cancel more than 1 hour before your session and your free session will be restored. 
                Cancellations within 1 hour of the session start time will forfeit your free session.
              </p>
              <p className="mt-2">
                For card payment refunds, please contact us at Milltownabc@gmail.com or speak to a coach at the gym. 
                Refunds for cancellations made more than 1 hour before the session will be processed within a few days.
              </p>
            </div>
          </Card>
          
          {/* Calendar Header */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={prevWeek} 
                disabled={isCurrentWeek}
                className="h-10 sm:h-9 px-2 sm:px-4"
                data-testid="button-prev-week"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              <div className="text-center min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-foreground">
                  {format(weekStart, "d MMM")} - {format(weekEnd, "d MMM yyyy")}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">2 weeks of sessions</p>
              </div>
              <Button 
                variant="outline" 
                onClick={nextWeek} 
                disabled={weekStart >= maxWeekStart}
                className="h-10 sm:h-9 px-2 sm:px-4"
                data-testid="button-next-week"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>
          </Card>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2 hidden sm:block">
                {day}
              </div>
            ))}
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={`short-${day}`} className="text-center text-sm font-semibold text-muted-foreground py-2 sm:hidden">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {twoWeeksDays.map(day => {
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
                    {format(day, "d MMM")}
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

          {/* Mobile: Select a Date prompt OR Selected Date Details */}
          <div className="sm:hidden mt-6">
            {!selectedDate ? (
              <Card className="p-6 text-center bg-muted/30" data-testid="mobile-select-date-prompt">
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground">Select a Date</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on a date with available classes to view session times and book.
                </p>
              </Card>
            ) : (
              <Card className="p-4" data-testid="mobile-selected-date-panel">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {classesForSelectedDate.length} class{classesForSelectedDate.length !== 1 ? "es" : ""} available
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                    Close
                  </Button>
                </div>

                {classesForSelectedDate.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No classes available on this date.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {classesForSelectedDate.map(boxingClass => {
                      const isBooking = bookingClassId === boxingClass.id;
                      const isEligibleForFree = currentMember && !currentMember.hasUsedFreeSession;

                      return (
                        <Card
                          key={boxingClass.id}
                          className={`p-4 border-2 ${isEligibleForFree ? 'ring-2 ring-green-500/30' : ''}`}
                          data-testid={`mobile-timeslot-${boxingClass.id}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-bold text-foreground">{boxingClass.time}</span>
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {boxingClass.duration} min
                            </Badge>
                          </div>
                          
                          <h3 className="font-semibold text-foreground mb-2">{boxingClass.title}</h3>
                          
                          <div className="flex items-center justify-end text-sm mb-4">
                            {isEligibleForFree ? (
                              <Badge variant="default" className="bg-green-600">FREE</Badge>
                            ) : (
                              <span className="font-bold text-primary">£5</span>
                            )}
                          </div>

                          {currentMember ? (
                            <Button
                              className={`w-full ${isEligibleForFree ? 'bg-green-600' : ''}`}
                              onClick={() => handleBookClick(boxingClass.id, isEligibleForFree ?? false)}
                              disabled={isBooking}
                            >
                              {isBooking ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isEligibleForFree ? (
                                <span><Check className="h-4 w-4 mr-2 inline" />Book Free First Session</span>
                              ) : (
                                <span><Check className="h-4 w-4 mr-2 inline" />Pay £5 with Square</span>
                              )}
                            </Button>
                          ) : (
                            <Button asChild className="w-full">
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
          </div>

          {/* Mobile: Upcoming Sessions List (only show when no date selected) */}
          <div className={`sm:hidden mt-6 ${selectedDate ? 'hidden' : ''}`}>
            <h2 className="text-lg font-bold text-foreground mb-4">Upcoming Sessions</h2>
            <div className="space-y-3">
              {(classes || [])
                .filter(c => !isBefore(new Date(c.date), startOfDay(new Date())))
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .slice(0, 10)
                .map(boxingClass => {
                  const classDate = new Date(boxingClass.date + "T12:00:00");
                  
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

          {/* Selected Date Details (Desktop only - mobile has its own panel above) */}
          {selectedDate && (
            <Card className="hidden sm:block mt-8 p-6" data-testid="selected-date-panel">
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
                        
                        <div className="flex items-center justify-end text-sm mb-4">
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
                            onClick={() => handleBookClick(boxingClass.id, isEligibleForFree ?? false)}
                            disabled={isBooking}
                            data-testid={`button-book-${boxingClass.id}`}
                          >
                            {isBooking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
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

          {/* Desktop: Select a Date prompt */}
          {!selectedDate && (
            <Card className="hidden sm:block mt-8 p-8 text-center">
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

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        if (!open && !isProcessingPayment) {
          setPaymentDialogOpen(false);
          setPaymentClassId(null);
          setPaymentMethod("card");
        }
      }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-payment">
          <DialogHeader>
            <DialogTitle>Book Session - £5</DialogTitle>
            <DialogDescription>
              Choose how you'd like to pay for this session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select 
                value={paymentMethod} 
                onValueChange={(value: "card" | "cash") => setPaymentMethod(value)}
                disabled={isProcessingPayment}
              >
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Card (Pay now)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      <span>Cash at reception</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "card" ? (
              <SquarePayment
                amount={500}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onCancel={() => {
                  setPaymentDialogOpen(false);
                  setPaymentClassId(null);
                  setPaymentMethod("card");
                }}
                isProcessing={isProcessingPayment}
              />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md" data-testid="cash-payment-note">
                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Pay cash when you arrive</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Bring £5 cash and pay at reception before your session.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPaymentDialogOpen(false);
                      setPaymentClassId(null);
                      setPaymentMethod("card");
                    }}
                    disabled={isProcessingPayment}
                    className="flex-1"
                    data-testid="button-cash-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCashBooking}
                    disabled={isProcessingPayment}
                    className="flex-1"
                    data-testid="button-cash-confirm"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
