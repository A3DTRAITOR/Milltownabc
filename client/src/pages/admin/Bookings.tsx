import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { ClipboardList, CheckCircle, XCircle, PoundSterling, TrendingUp, Calendar, AlertCircle } from "lucide-react";

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
    price?: string;
  };
}

const SESSION_PRICE = 15.00;

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<string>("confirmed");
  const [activeTab, setActiveTab] = useState<string>("bookings");
  
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
  const confirmedBookings = allBookings.filter(b => b.status === "confirmed");
  const cancelledBookings = allBookings.filter(b => b.status === "cancelled");
  
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const todayRevenue = confirmedBookings
    .filter(b => isAfter(new Date(b.bookedAt), todayStart))
    .length * SESSION_PRICE;
  
  const weekRevenue = confirmedBookings
    .filter(b => isAfter(new Date(b.bookedAt), weekStart))
    .length * SESSION_PRICE;
  
  const monthRevenue = confirmedBookings
    .filter(b => isAfter(new Date(b.bookedAt), monthStart))
    .length * SESSION_PRICE;
  
  const totalRevenue = confirmedBookings.length * SESSION_PRICE;
  const refundedAmount = cancelledBookings.length * SESSION_PRICE;
  
  const filteredBookings = allBookings
    .filter(b => statusFilter === "all" || b.status === statusFilter)
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

  return (
    <AdminLayout title="Bookings & Finance">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Bookings & Finance</h2>
            <p className="text-muted-foreground">View bookings and financial records.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings</TabsTrigger>
            <TabsTrigger value="finance" data-testid="tab-finance">Financial Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6 mt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{confirmedBookings.length}</p>
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
                    <p className="text-2xl font-bold text-foreground">{cancelledBookings.length}</p>
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
                      <TableHead>Amount</TableHead>
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
                          <span className={booking.status === "cancelled" ? "line-through text-muted-foreground" : "font-medium"}>
                            £{SESSION_PRICE.toFixed(2)}
                          </span>
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
          </TabsContent>

          <TabsContent value="finance" className="space-y-6 mt-6">
            <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">VAT Status: Not Registered</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    VAT is not charged as annual turnover is below the £90,000 registration threshold. 
                    If your turnover exceeds this, you must register for VAT with HMRC.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
                    <PoundSterling className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">£{todayRevenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">£{weekRevenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">£{monthRevenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <PoundSterling className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">£{totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Financial Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Confirmed Bookings</span>
                  <span className="font-medium">{confirmedBookings.length} x £{SESSION_PRICE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Gross Revenue</span>
                  <span className="font-medium">£{totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Cancelled/Refunded</span>
                  <span className="font-medium text-destructive">-£{refundedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">VAT (Not Registered)</span>
                  <span className="font-medium">£0.00</span>
                </div>
                <div className="flex justify-between items-center py-2 text-lg">
                  <span className="font-semibold">Net Revenue</span>
                  <span className="font-bold text-primary">£{totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Transaction Ledger</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete record of all transactions for accounting purposes.
              </p>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBookings.slice(0, 50).map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="text-sm">
                            {format(new Date(booking.bookedAt), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {booking.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>{booking.member?.name || "Unknown"}</TableCell>
                          <TableCell>
                            Boxing class: {booking.class?.title || "Session"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(booking.status)}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {booking.status === "cancelled" ? (
                              <span className="text-destructive">-£{SESSION_PRICE.toFixed(2)}</span>
                            ) : (
                              <span>£{SESSION_PRICE.toFixed(2)}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            <Card className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                <strong>Record Keeping:</strong> These records should be kept for at least 6 years for HMRC compliance. 
                For full accounting, export this data to your accounting software. All amounts are in GBP (£). 
                Session price: £{SESSION_PRICE.toFixed(2)} per booking.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
