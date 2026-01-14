import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, Users, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";
import type { BoxingClass } from "@shared/schema";

export default function Sessions() {
  const { toast } = useToast();

  const { data: classes, isLoading } = useQuery<BoxingClass[]>({
    queryKey: ["/api/classes"],
  });

  const { data: currentMember } = useQuery({
    queryKey: ["/api/members/me"],
    retry: false,
  });

  const bookMutation = useMutation({
    mutationFn: async (classId: string) => {
      const res = await apiRequest("POST", `/api/classes/${classId}/book`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/bookings"] });
      toast({ title: "Booking confirmed!", description: "You've successfully booked this class." });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Unable to book class",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, MMMM d");
    } catch {
      return dateStr;
    }
  };

  const getClassTypeColor = (classType: string) => {
    switch (classType.toLowerCase()) {
      case "boxing fundamentals": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "sparring": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "fitness boxing": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "technique": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-12 w-1/3 mb-8" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead title="Class Schedule - Milltown Boxing Club" description="View and book boxing classes at Milltown Boxing Club. Sessions for all experience levels." />

      <section className="bg-gradient-to-b from-primary/5 to-background py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground" data-testid="text-sessions-title">
            Class Schedule
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Book your spot in our upcoming sessions. All classes are £15 per session.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {!classes || classes.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No upcoming classes scheduled. Check back soon!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {classes.map((boxingClass) => {
                const spotsLeft = (boxingClass.capacity || 12) - (boxingClass.bookedCount || 0);
                const isFull = spotsLeft <= 0;

                return (
                  <Card key={boxingClass.id} className="p-6" data-testid={`card-class-${boxingClass.id}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-foreground">{boxingClass.title}</h3>
                          <Badge variant="secondary" className={getClassTypeColor(boxingClass.classType)}>
                            {boxingClass.classType}
                          </Badge>
                        </div>
                        
                        {boxingClass.description && (
                          <p className="text-sm text-muted-foreground">{boxingClass.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(boxingClass.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {boxingClass.time} ({boxingClass.duration} mins)
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {spotsLeft} spots left
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <span className="text-2xl font-bold text-primary">£{boxingClass.price}</span>
                        
                        {currentMember ? (
                          <Button
                            onClick={() => bookMutation.mutate(boxingClass.id)}
                            disabled={isFull || bookMutation.isPending}
                            data-testid={`button-book-${boxingClass.id}`}
                          >
                            {bookMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isFull ? (
                              "Fully Booked"
                            ) : (
                              "Book Now"
                            )}
                          </Button>
                        ) : (
                          <Button asChild data-testid={`button-login-to-book-${boxingClass.id}`}>
                            <Link href="/login">Login to Book</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
