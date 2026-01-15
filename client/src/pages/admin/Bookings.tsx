import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState<string>("confirmed");
  
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

  const allBookings = bookings || [];
  const confirmedCount = allBookings.filter(b => b.status === "confirmed").length;
  const cancelledCount = allBookings.filter(b => b.status === "cancelled").length;
  
  const filteredBookings = allBookings
    .filter(b => statusFilter === "all" || b.status === statusFilter)
    .sort((a, b) => {
      if (a.class && b.class) {
        const dateA = new Date(a.class.date + "T" + a.class.time);
        const dateB = new Date(b.class.date + "T" + b.class.time);
        return dateB.getTime() - dateA.getTime();
      }
      return new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime();
    });

  return (
    <AdminLayout title="Bookings">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">All Bookings</h2>
            <p className="text-muted-foreground">View and manage class bookings.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/10 p-2 text-gray-500">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{cancelledCount}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{allBookings.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmed only</SelectItem>
                <SelectItem value="cancelled">Cancelled only</SelectItem>
                <SelectItem value="all">All bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            Showing {filteredBookings.length} of {allBookings.length}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !filteredBookings.length ? (
          <Card className="p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {statusFilter === "all" ? "No bookings yet." : `No ${statusFilter} bookings.`}
            </p>
            {statusFilter !== "all" && (
              <Button variant="ghost" onClick={() => setStatusFilter("all")} className="mt-2" data-testid="button-show-all">
                Show all bookings
              </Button>
            )}
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Booked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                    <TableCell className="font-medium">
                      {booking.class?.title || "Unknown Class"}
                    </TableCell>
                    <TableCell>
                      {booking.class ? (
                        <div className="flex items-center gap-1 text-sm">
                          <span>{format(new Date(booking.class.date), "MMM d")}</span>
                          <span className="text-muted-foreground">at</span>
                          <span>{booking.class.time}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.member?.name || "Unknown"}</p>
                        {booking.member?.email && (
                          <p className="text-xs text-muted-foreground">{booking.member.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(booking.bookedAt), "MMM d, h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
