import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, User, LogOut, X, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import type { Booking, BoxingClass } from "@shared/schema";

type BookingWithClass = Booking & { class?: BoxingClass; isFreeSession?: boolean; price?: string };

interface MemberData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  experienceLevel: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const { data: member, isLoading: memberLoading, isError } = useQuery<MemberData>({
    queryKey: ["/api/members/me"],
    retry: false,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithClass[]>({
    queryKey: ["/api/members/me/bookings"],
    enabled: !!member,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/members/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      toast({ title: "Logged out", description: "You've been logged out successfully." });
      setLocation("/");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await apiRequest("DELETE", `/api/bookings/${bookingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Booking cancelled", description: "Your booking has been cancelled." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel booking.", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("DELETE", "/api/members/me", { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      toast({ title: "Account deleted", description: "Your account and all data have been removed." });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete account.", variant: "destructive" });
    },
  });

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      toast({ title: "Error", description: "Please enter your password to confirm.", variant: "destructive" });
      return;
    }
    deleteAccountMutation.mutate(deletePassword);
  };

  // Redirect if not logged in
  if (isError) {
    setLocation("/login");
    return null;
  }

  if (memberLoading) {
    return (
      <PublicLayout>
        <div className="py-16">
          <div className="mx-auto max-w-4xl px-4">
            <Skeleton className="h-12 w-1/3 mb-8" />
            <Skeleton className="h-40 mb-6" />
            <Skeleton className="h-60" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  const upcomingBookings = bookings?.filter(
    b => b.status !== 'cancelled' && b.class && !isPast(parseISO(`${b.class.date}T${b.class.time}`))
  ) || [];

  const pastBookings = bookings?.filter(
    b => b.status !== 'cancelled' && b.class && isPast(parseISO(`${b.class.date}T${b.class.time}`))
  ) || [];

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, MMM d");
    } catch {
      return dateStr;
    }
  };

  return (
    <PublicLayout>
      <SEOHead title="My Dashboard - Mill Town ABC" description="View and manage your boxing class bookings." />

      <section className="bg-gradient-to-b from-primary/5 to-background py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
                Welcome, {member?.name?.split(' ')[0]}!
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage your bookings and profile
              </p>
            </div>
            <Button variant="outline" onClick={() => logoutMutation.mutate()} data-testid="button-logout">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Profile Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{member?.name}</h2>
                  <p className="text-sm text-muted-foreground">{member?.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {member?.experienceLevel ? member.experienceLevel.charAt(0).toUpperCase() + member.experienceLevel.slice(1) : 'Beginner'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Upcoming Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Classes</h2>
              <Button asChild size="sm">
                <Link href="/sessions">Book More</Link>
              </Button>
            </div>
            
            {bookingsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No upcoming bookings</p>
                <Button asChild>
                  <Link href="/sessions">Browse Classes</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="p-4" data-testid={`card-booking-${booking.id}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{booking.class?.title}</h3>
                          {booking.isFreeSession ? (
                            <Badge variant="default" className="bg-green-600 text-xs" data-testid={`badge-free-${booking.id}`}>FREE</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-price-${booking.id}`}>£{booking.price || '5'}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(booking.class?.date || '')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.class?.time}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        data-testid={`button-cancel-${booking.id}`}
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="mr-1 h-4 w-4" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Bookings */}
          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Booking History</h2>
              <div className="space-y-3">
                {pastBookings.map((booking) => (
                  <Card key={booking.id} className="p-4 opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{booking.class?.title}</h3>
                          {booking.isFreeSession ? (
                            <Badge variant="default" className="bg-green-600/70 text-xs" data-testid={`badge-history-free-${booking.id}`}>FREE</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-history-price-${booking.id}`}>£{booking.price || '5'}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.class?.date || '')} at {booking.class?.time}
                        </p>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Delete Account Section */}
          <div className="pt-8 border-t">
            <h2 className="text-xl font-semibold text-foreground mb-4">Account Settings</h2>
            
            {!showDeleteConfirm ? (
              <Card className="p-6 border-destructive/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently remove your account and all associated data
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteConfirm(true)}
                    data-testid="button-show-delete"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-destructive">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-destructive">This action cannot be undone</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your account, booking history, and all personal information will be permanently deleted.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Enter your password to confirm</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      data-testid="input-delete-password"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword("");
                      }}
                      data-testid="button-cancel-delete"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountMutation.isPending || !deletePassword}
                      data-testid="button-confirm-delete"
                    >
                      {deleteAccountMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete My Account
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
