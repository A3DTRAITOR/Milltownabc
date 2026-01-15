import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ClipboardList, Calendar, Clock, User } from "lucide-react";

interface Booking {
  id: string;
  memberId: string;
  classId: string;
  status: string;
  bookedAt: string;
  member?: {
    name: string;
    email: string;
  };
  class?: {
    title: string;
    date: string;
    time: string;
    classType: string;
  };
}

export default function AdminBookings() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "default";
      case "cancelled": return "secondary";
      case "pending": return "outline";
      default: return "secondary";
    }
  };

  const sortedBookings = bookings?.sort((a, b) => 
    new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()
  ) || [];

  return (
    <AdminLayout title="Bookings">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Bookings</h2>
          <p className="text-muted-foreground">View all class bookings made by members.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !sortedBookings.length ? (
          <Card className="p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bookings yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => (
              <Card key={booking.id} className="p-4" data-testid={`card-booking-${booking.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {booking.class?.title || "Unknown Class"}
                      </h3>
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {booking.member?.name || "Unknown Member"}
                      </span>
                      {booking.class && (
                        <>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(booking.class.date), "EEE, MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {booking.class.time}
                          </span>
                        </>
                      )}
                      <span className="text-xs">
                        Booked: {format(new Date(booking.bookedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Total: {sortedBookings.length} bookings
        </div>
      </div>
    </AdminLayout>
  );
}
