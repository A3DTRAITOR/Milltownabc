import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { User, Mail, Phone, Calendar } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  experienceLevel?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export default function AdminMembers() {
  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/admin/members"],
  });

  return (
    <AdminLayout title="Members">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">All Members</h2>
          <p className="text-muted-foreground">View and manage club members.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : !members?.length ? (
          <Card className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No members registered yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <Card key={member.id} className="p-4" data-testid={`card-member-${member.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground" data-testid={`text-member-name-${member.id}`}>
                          {member.name}
                        </h3>
                        {member.isAdmin && <Badge variant="default">Admin</Badge>}
                        {member.experienceLevel && (
                          <Badge variant="secondary">{member.experienceLevel}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {member.phone}
                          </span>
                        )}
                        {member.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Joined {format(new Date(member.createdAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Total: {members?.length || 0} members
        </div>
      </div>
    </AdminLayout>
  );
}
