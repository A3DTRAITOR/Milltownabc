import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users, Clock, Loader2, Eye, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import type { BoxingClass } from "@shared/schema";

interface Booking {
  id: string;
  classId: string;
  status: string;
  bookedAt: string;
  member?: {
    name: string;
    email: string;
  };
}

interface ClassFormData {
  title: string;
  description: string;
  classType: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  price: string;
  isActive: boolean;
}

const defaultFormData: ClassFormData = {
  title: "",
  description: "",
  classType: "Boxing Fundamentals",
  date: "",
  time: "18:00",
  duration: 60,
  capacity: 12,
  price: "15.00",
  isActive: true,
};

const classTypes = [
  "Boxing Fundamentals",
  "Technique",
  "Fitness Boxing",
  "Sparring",
  "Beginner",
  "Intermediate",
  "Advanced",
];

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminCalendar() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<BoxingClass | null>(null);
  const [deleteClass, setDeleteClass] = useState<BoxingClass | null>(null);
  const [attendeesClass, setAttendeesClass] = useState<BoxingClass | null>(null);
  const [formData, setFormData] = useState<ClassFormData>(defaultFormData);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  const { data: classes, isLoading } = useQuery<BoxingClass[]>({
    queryKey: ["/api/admin/classes"],
  });

  const { data: allBookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const getAttendeesForClass = (classId: string) => {
    return (allBookings || []).filter(b => b.classId === classId && b.status === "confirmed");
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: ClassFormData) => {
      const res = await apiRequest("POST", "/api/admin/classes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Class created", description: "The class has been added to the calendar." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create class", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClassFormData }) => {
      const res = await apiRequest("PUT", `/api/admin/classes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Class updated", description: "The class has been updated." });
      setIsDialogOpen(false);
      setEditingClass(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update class", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Class deleted", description: "The class has been removed." });
      setDeleteClass(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete class", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingClass(null);
  };

  const openEditDialog = (boxingClass: BoxingClass) => {
    setEditingClass(boxingClass);
    setFormData({
      title: boxingClass.title,
      description: boxingClass.description || "",
      classType: boxingClass.classType,
      date: boxingClass.date,
      time: boxingClass.time,
      duration: boxingClass.duration || 60,
      capacity: boxingClass.capacity || 12,
      price: boxingClass.price || "15.00",
      isActive: boxingClass.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const weekClasses = (classes || []).filter((boxingClass) => {
    const classDate = parseISO(boxingClass.date);
    return isWithinInterval(classDate, { start: currentWeekStart, end: weekEnd });
  }).sort((a, b) => {
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA.getTime() - dateB.getTime();
  });

  const groupedByDay = dayNames.map((_, index) => {
    const dayDate = new Date(currentWeekStart);
    dayDate.setDate(dayDate.getDate() + index);
    const dateStr = format(dayDate, "yyyy-MM-dd");
    return {
      date: dayDate,
      dateStr,
      dayName: dayNames[index],
      classes: weekClasses.filter(c => c.date === dateStr),
    };
  });

  const isCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime() === currentWeekStart.getTime();

  return (
    <AdminLayout title="Calendar">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Class Schedule</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your boxing class sessions.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" data-testid="button-add-class">
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Class Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Beginner Boxing"
                    required
                    data-testid="input-class-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classType">Class Type</Label>
                  <Select value={formData.classType} onValueChange={(v) => setFormData({ ...formData, classType: v })}>
                    <SelectTrigger data-testid="select-class-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      data-testid="input-class-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      data-testid="input-class-time"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                      min={15}
                      max={180}
                      data-testid="input-class-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 12 })}
                      min={1}
                      max={50}
                      data-testid="input-class-capacity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (£)</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="15.00"
                      data-testid="input-class-price"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the class..."
                    rows={3}
                    data-testid="input-class-description"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel-class">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-class">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingClass ? "Save Changes" : "Create Class"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek} data-testid="button-prev-week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {format(currentWeekStart, "d MMM")} - {format(weekEnd, "d MMM yyyy")}
              </h3>
              {!isCurrentWeek && (
                <Button variant="ghost" size="sm" onClick={goToCurrentWeek} className="text-xs" data-testid="button-today">
                  Back to this week
                </Button>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={goToNextWeek} data-testid="button-next-week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByDay.map(({ date, dateStr, dayName, classes: dayClasses }) => {
                const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
                const isPast = new Date(dateStr) < new Date(format(new Date(), "yyyy-MM-dd"));
                
                return (
                  <div key={dateStr} className={`border rounded-lg ${isToday ? "border-primary bg-primary/5" : isPast ? "opacity-60" : ""}`}>
                    <div className={`px-4 py-2 border-b ${isToday ? "bg-primary/10" : "bg-muted/30"}`}>
                      <span className="font-semibold text-foreground">{dayName}</span>
                      <span className="ml-2 text-sm text-muted-foreground">{format(date, "d MMM")}</span>
                      {isToday && <Badge className="ml-2" variant="default">Today</Badge>}
                    </div>
                    
                    {dayClasses.length === 0 ? (
                      <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                        No classes scheduled
                      </div>
                    ) : (
                      <div className="divide-y">
                        {dayClasses.map((boxingClass) => (
                          <div key={boxingClass.id} className="p-3 sm:p-4" data-testid={`card-class-${boxingClass.id}`}>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{boxingClass.title}</h4>
                                  <Badge variant="secondary" className="text-xs">{boxingClass.classType}</Badge>
                                  {!boxingClass.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    {boxingClass.time} ({boxingClass.duration} min)
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    {boxingClass.bookedCount || 0}/{boxingClass.capacity}
                                  </span>
                                  <span className="font-medium text-primary">£{boxingClass.price}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 justify-end shrink-0">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setAttendeesClass(boxingClass)} 
                                  className="text-xs h-8 px-2 sm:px-3"
                                  data-testid={`button-attendees-${boxingClass.id}`}
                                >
                                  <Eye className="h-3.5 w-3.5 sm:mr-1" />
                                  <span className="hidden sm:inline">Attendees</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(boxingClass)} data-testid={`button-edit-${boxingClass.id}`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteClass(boxingClass)} data-testid={`button-delete-${boxingClass.id}`}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <AlertDialog open={!!deleteClass} onOpenChange={() => setDeleteClass(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Class</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteClass?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteClass && deleteMutation.mutate(deleteClass.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!attendeesClass} onOpenChange={() => setAttendeesClass(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Attendees - {attendeesClass?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-4">
                {attendeesClass && format(new Date(attendeesClass.date), "EEEE, MMMM d, yyyy")} at {attendeesClass?.time}
              </p>
              {attendeesClass && getAttendeesForClass(attendeesClass.id).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No confirmed bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {attendeesClass && getAttendeesForClass(attendeesClass.id).map((booking, index) => (
                    <div 
                      key={booking.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      data-testid={`attendee-${booking.id}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {booking.member?.name || "Unknown"}
                        </p>
                        {booking.member?.email && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {booking.member.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {attendeesClass && getAttendeesForClass(attendeesClass.id).length} / {attendeesClass?.capacity} spots filled
                </span>
                <Button variant="outline" onClick={() => setAttendeesClass(null)} data-testid="button-close-attendees">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
