import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Clock, Calendar, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClassTemplate {
  id: string;
  dayOfWeek: number;
  time: string;
  title: string;
  classType: string;
  duration: number;
  description: string | null;
  isActive: boolean;
}

const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const classTypes = [
  { value: "beginners", label: "Beginners" },
  { value: "open", label: "Open Class" },
  { value: "senior", label: "Senior & Carded" },
  { value: "fitness", label: "Fitness Boxing" },
  { value: "sparring", label: "Sparring" },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dayOfWeek: z.string().min(1, "Day is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  classType: z.string().min(1, "Class type is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminSchedule() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ClassTemplate | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      dayOfWeek: "",
      time: "",
      duration: "60",
      classType: "open",
    },
  });

  const { data: templates, isLoading } = useQuery<ClassTemplate[]>({
    queryKey: ["/api/admin/class-templates"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/class-templates/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/class-templates"] });
      toast({ title: "Updated", description: "Schedule updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/admin/class-templates", {
        title: data.title,
        dayOfWeek: parseInt(data.dayOfWeek),
        time: data.time,
        duration: parseInt(data.duration),
        classType: data.classType,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/class-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Created", description: "New class added to schedule" });
      setCreateOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create class", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/class-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/class-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Deleted", description: "Class removed from schedule" });
      setTemplateToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete class", variant: "destructive" });
    }
  });

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  const activeTemplates = templates?.filter(t => t.isActive) || [];
  const pausedTemplates = templates?.filter(t => !t.isActive) || [];

  const TemplateRow = ({ template, isActive }: { template: ClassTemplate; isActive: boolean }) => (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg ${
        isActive ? "bg-green-50 dark:bg-green-900/20" : "bg-muted/50 opacity-60"
      }`}
      data-testid={`template-${isActive ? 'active' : 'paused'}-${template.id}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isActive ? "outline" : "secondary"} className="text-xs">
            {shortDayNames[template.dayOfWeek]}
          </Badge>
          <span className="font-medium text-sm">{template.time}</span>
          <span className="text-xs text-muted-foreground">{template.duration}min</span>
        </div>
        <p className="font-medium text-foreground mt-1 truncate">{template.title}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTemplateToDelete(template)}
          data-testid={`delete-${template.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
        <Switch
          checked={isActive}
          onCheckedChange={() => handleToggle(template.id)}
          disabled={toggleMutation.isPending}
          data-testid={`toggle-${template.id}`}
        />
      </div>
    </div>
  );

  return (
    <AdminLayout title="Schedule Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Weekly Schedule</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage recurring sessions. Classes generate 2 weeks ahead.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-class" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Add a new recurring session to the weekly schedule.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input className="h-12 text-base" placeholder="e.g. Beginners Class" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-day">
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fullDayNames.map((day, index) => (
                                <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input className="h-12 text-base" type="time" {...field} data-testid="input-time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (mins)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-duration">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">60 minutes</SelectItem>
                              <SelectItem value="90">90 minutes</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="classType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-class">
                    {createMutation.isPending ? "Creating..." : "Create Class"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Active Sessions
              </h3>
              {activeTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No active sessions. Create a new class or enable a paused one.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeTemplates.map((template) => (
                    <TemplateRow key={template.id} template={template} isActive={true} />
                  ))}
                </div>
              )}
            </Card>

            {pausedTemplates.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Paused Sessions
                </h3>
                <div className="space-y-3">
                  {pausedTemplates.map((template) => (
                    <TemplateRow key={template.id} template={template} isActive={false} />
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200">How it works</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• New classes appear on the calendar 2 weeks ahead</li>
                <li>• Toggle off to pause a session (existing bookings not affected)</li>
                <li>• Delete removes the template permanently</li>
              </ul>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{templateToDelete?.title}</strong>? 
              This will stop future sessions from being created. Existing bookings will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => templateToDelete && deleteMutation.mutate(templateToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
