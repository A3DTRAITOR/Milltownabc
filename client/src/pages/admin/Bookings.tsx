import { useState, useMemo } from "react";
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
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, subMonths } from "date-fns";
import { ClipboardList, CheckCircle, XCircle, PoundSterling, TrendingUp, Calendar, AlertCircle, Download, FileText, Building2 } from "lucide-react";

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

const SESSION_PRICE = 15.00;
const BUSINESS_NAME = "Milltown Boxing Club";
const BUSINESS_ADDRESS = "Milltown, Ireland";
const CURRENCY = "GBP";

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<string>("confirmed");
  const [activeTab, setActiveTab] = useState<string>("bookings");
  const [financePeriod, setFinancePeriod] = useState<string>("all");
  
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
  const yearStart = startOfYear(now);
  const lastMonthStart = subMonths(monthStart, 1);

  const getFilteredByPeriod = (list: Booking[], period: string) => {
    switch (period) {
      case "today":
        return list.filter(b => isAfter(new Date(b.bookedAt), todayStart));
      case "week":
        return list.filter(b => isAfter(new Date(b.bookedAt), weekStart));
      case "month":
        return list.filter(b => isAfter(new Date(b.bookedAt), monthStart));
      case "lastmonth":
        return list.filter(b => {
          const date = new Date(b.bookedAt);
          return isAfter(date, lastMonthStart) && !isAfter(date, monthStart);
        });
      case "year":
        return list.filter(b => isAfter(new Date(b.bookedAt), yearStart));
      default:
        return list;
    }
  };

  const todayRevenue = confirmedBookings.filter(b => isAfter(new Date(b.bookedAt), todayStart)).length * SESSION_PRICE;
  const weekRevenue = confirmedBookings.filter(b => isAfter(new Date(b.bookedAt), weekStart)).length * SESSION_PRICE;
  const monthRevenue = confirmedBookings.filter(b => isAfter(new Date(b.bookedAt), monthStart)).length * SESSION_PRICE;
  const yearRevenue = confirmedBookings.filter(b => isAfter(new Date(b.bookedAt), yearStart)).length * SESSION_PRICE;
  const totalRevenue = confirmedBookings.length * SESSION_PRICE;
  const refundedAmount = cancelledBookings.length * SESSION_PRICE;
  
  const filteredBookings = allBookings
    .filter(b => statusFilter === "all" || b.status === statusFilter)
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

  const financeBookings = useMemo(() => {
    return getFilteredByPeriod(allBookings, financePeriod)
      .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());
  }, [allBookings, financePeriod]);

  const financeConfirmed = financeBookings.filter(b => b.status === "confirmed");
  const financeCancelled = financeBookings.filter(b => b.status === "cancelled");
  const financeGross = financeConfirmed.length * SESSION_PRICE;
  const financeRefunds = financeCancelled.length * SESSION_PRICE;

  const exportToCSV = () => {
    const headers = [
      "Transaction Date",
      "Transaction ID", 
      "Member Name",
      "Member Email",
      "Service Description",
      "Class Date",
      "Class Time",
      "Status",
      "Amount (GBP)",
      "VAT Amount",
      "Net Amount",
      "Payment Method"
    ];

    const rows = financeBookings.map(booking => [
      format(new Date(booking.bookedAt), "dd/MM/yyyy HH:mm:ss"),
      booking.id,
      booking.member?.name || "Unknown",
      booking.member?.email || "",
      `Boxing class: ${booking.class?.title || "Session"}`,
      booking.class?.date || "",
      booking.class?.time || "",
      booking.status,
      booking.status === "cancelled" ? `-${SESSION_PRICE.toFixed(2)}` : SESSION_PRICE.toFixed(2),
      "0.00",
      booking.status === "cancelled" ? `-${SESSION_PRICE.toFixed(2)}` : SESSION_PRICE.toFixed(2),
      "Online Card Payment"
    ]);

    const summaryRows = [
      [],
      ["FINANCIAL SUMMARY"],
      ["Business Name", BUSINESS_NAME],
      ["Report Period", financePeriod === "all" ? "All Time" : financePeriod],
      ["Generated", format(new Date(), "dd/MM/yyyy HH:mm:ss")],
      [],
      ["Total Confirmed Bookings", financeConfirmed.length.toString()],
      ["Gross Revenue", `£${financeGross.toFixed(2)}`],
      ["Cancelled/Refunded", `£${financeRefunds.toFixed(2)}`],
      ["VAT (Not Registered)", "£0.00"],
      ["Net Revenue", `£${financeGross.toFixed(2)}`],
      [],
      ["Note: VAT not charged - turnover below £90,000 threshold"],
      ["Records retained for HMRC compliance (6 years minimum)"]
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ...summaryRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `milltown-boxing-finance-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Bookings & Finance">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Bookings & Finance</h2>
            <p className="text-muted-foreground">View bookings and financial records for tax compliance.</p>
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
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{BUSINESS_NAME}</p>
                  <p className="text-sm text-muted-foreground">{BUSINESS_ADDRESS}</p>
                  <p className="text-xs text-muted-foreground mt-1">Currency: {CURRENCY} | Session Rate: £{SESSION_PRICE.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">VAT Status: Not Registered</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    VAT is not charged as annual turnover is below the £90,000 registration threshold (2024/25). 
                    Monitor your turnover - you must register within 30 days if you expect to exceed £90,000 in the next 30 days.
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
                    <p className="text-2xl font-bold text-foreground">£{yearRevenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">This Tax Year</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Financial Summary</h3>
                <div className="flex items-center gap-2">
                  <Select value={financePeriod} onValueChange={setFinancePeriod}>
                    <SelectTrigger className="w-[160px]" data-testid="select-finance-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="lastmonth">Last Month</SelectItem>
                      <SelectItem value="year">This Tax Year</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Confirmed Bookings</span>
                  <span className="font-medium">{financeConfirmed.length} x £{SESSION_PRICE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Gross Revenue</span>
                  <span className="font-medium">£{financeGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Cancelled/Refunded ({financeCancelled.length})</span>
                  <span className="font-medium text-destructive">-£{financeRefunds.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">VAT (Not Registered)</span>
                  <span className="font-medium">£0.00</span>
                </div>
                <div className="flex justify-between items-center py-2 text-lg">
                  <span className="font-semibold">Net Revenue</span>
                  <span className="font-bold text-primary">£{financeGross.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Transaction Ledger</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete record of all transactions for HMRC compliance and accounting.
                  </p>
                </div>
                <Button onClick={exportToCSV} variant="outline" data-testid="button-export-csv">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : financeBookings.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No transactions for this period.</p>
                </div>
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
                        <TableHead className="text-right">Amount (GBP)</TableHead>
                        <TableHead className="text-right">Running Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financeBookings.map((booking, index) => {
                        const runningTotal = financeBookings
                          .slice(index)
                          .filter(b => b.status === "confirmed")
                          .length * SESSION_PRICE;
                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {format(new Date(booking.bookedAt), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              TXN-{booking.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{booking.member?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{booking.member?.email || ""}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              Boxing class: {booking.class?.title || "Session"}
                              {booking.class?.date && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({format(new Date(booking.class.date), "dd/MM/yy")})
                                </span>
                              )}
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
                                <span className="text-green-600">+£{SESSION_PRICE.toFixed(2)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              £{runningTotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  HMRC Record Keeping
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Keep all records for at least 6 years</li>
                  <li>• Records must show date, amount, and payer details</li>
                  <li>• Store bank statements alongside these records</li>
                  <li>• Export CSV regularly for backup</li>
                </ul>
              </Card>
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Tax Reporting Notes
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Self Assessment: Report income for tax year (6 Apr - 5 Apr)</li>
                  <li>• VAT Threshold (2024/25): £90,000 annual turnover</li>
                  <li>• Total Revenue This Year: £{yearRevenue.toFixed(2)}</li>
                  <li>• All-Time Revenue: £{totalRevenue.toFixed(2)}</li>
                </ul>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
