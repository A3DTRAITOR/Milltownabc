import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar } from "lucide-react";
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

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminSchedule() {
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<ClassTemplate[]>({
    queryKey: ["/api/admin/class-templates"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/class-templates/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/class-templates"] });
      toast({ title: "Updated", description: "Schedule updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update schedule", variant: "destructive" });
    }
  });

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const activeTemplates = templates?.filter(t => t.isActive) || [];
  const pausedTemplates = templates?.filter(t => !t.isActive) || [];

  return (
    <AdminLayout title="Schedule Settings">
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Weekly Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Toggle sessions on/off. Classes are generated 2 weeks ahead.
          </p>
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
                  No active sessions. Toggle a session below to activate it.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      data-testid={`template-active-${template.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {shortDayNames[template.dayOfWeek]}
                          </Badge>
                          <span className="font-medium text-sm">{template.time}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.duration}min
                          </span>
                        </div>
                        <p className="font-medium text-foreground mt-1 truncate">
                          {template.title}
                        </p>
                      </div>
                      <Switch
                        checked={true}
                        onCheckedChange={() => handleToggle(template.id)}
                        disabled={toggleMutation.isPending}
                        data-testid={`toggle-${template.id}`}
                      />
                    </div>
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
                    <div 
                      key={template.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg opacity-60"
                      data-testid={`template-paused-${template.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {shortDayNames[template.dayOfWeek]}
                          </Badge>
                          <span className="font-medium text-sm">{template.time}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.duration}min
                          </span>
                        </div>
                        <p className="font-medium text-foreground mt-1 truncate">
                          {template.title}
                        </p>
                      </div>
                      <Switch
                        checked={false}
                        onCheckedChange={() => handleToggle(template.id)}
                        disabled={toggleMutation.isPending}
                        data-testid={`toggle-${template.id}`}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200">How it works</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                <li>• Active sessions appear on the calendar 2 weeks ahead</li>
                <li>• Pausing a session stops new classes from being created</li>
                <li>• Existing bookings are not affected when you pause</li>
                <li>• Changes take effect immediately</li>
              </ul>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
