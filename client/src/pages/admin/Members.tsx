import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { User, Mail, Phone, Calendar, AlertTriangle, Trash2, Pencil, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  experienceLevel?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export default function AdminMembers() {
  const { toast } = useToast();
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/admin/members"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return apiRequest("DELETE", `/api/admin/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ 
        title: "Member deleted", 
        description: "The member has been removed. Payment records have been retained with personal info redacted." 
      });
      setMemberToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Delete failed", 
        description: error.message || "Failed to delete member", 
        variant: "destructive" 
      });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Member> }) => {
      const res = await apiRequest("PATCH", `/api/admin/members/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      toast({ title: "Member updated", description: "Member information has been saved." });
      setMemberToEdit(null);
      setEditForm({});
    },
    onError: (error: any) => {
      toast({ 
        title: "Update failed", 
        description: error.message || "Failed to update member", 
        variant: "destructive" 
      });
    }
  });

  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      deleteMutation.mutate(memberToDelete.id);
    }
  };

  const handleEditClick = (member: Member) => {
    setMemberToEdit(member);
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      age: member.age,
      emergencyContactName: member.emergencyContactName || "",
      emergencyContactPhone: member.emergencyContactPhone || "",
      experienceLevel: member.experienceLevel || "beginner",
    });
  };

  const handleEditSave = () => {
    if (!memberToEdit) return;
    editMutation.mutate({ id: memberToEdit.id, data: editForm });
  };

  return (
    <AdminLayout title="Members">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">All Members</h2>
          <p className="text-sm sm:text-base text-muted-foreground">View and manage club members.</p>
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
          <div className="space-y-3">
            {members.map((member) => (
              <Card key={member.id} className="p-3 sm:p-4" data-testid={`card-member-${member.id}`}>
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
                    <div className="rounded-full bg-primary/10 p-2 sm:p-3 text-primary shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base" data-testid={`text-member-name-${member.id}`}>
                          {member.name}
                        </h3>
                        {member.isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
                        {member.experienceLevel && (
                          <Badge variant="secondary" className="text-xs">{member.experienceLevel}</Badge>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {member.phone}
                          </span>
                        )}
                        {member.age && (
                          <span className="text-muted-foreground">
                            Age: {member.age}
                          </span>
                        )}
                        {member.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {format(new Date(member.createdAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {(member.emergencyContactName || member.emergencyContactPhone) && (
                        <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm">
                          <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 shrink-0" />
                          <span className="text-muted-foreground truncate">
                            Emergency: {member.emergencyContactName}
                            {member.emergencyContactPhone && ` - ${member.emergencyContactPhone}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(member)}
                      title="Edit member"
                      data-testid={`button-edit-member-${member.id}`}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteClick(member)}
                      disabled={member.isAdmin}
                      title={member.isAdmin ? "Cannot delete admin accounts" : "Delete member"}
                      data-testid={`button-delete-member-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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

      <Dialog open={!!memberToEdit} onOpenChange={(open) => { if (!open) { setMemberToEdit(null); setEditForm({}); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email || ""}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                data-testid="input-edit-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={(editForm.phone as string) || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/[^0-9+\s\-\(\)]/g, "") })}
                placeholder="07123 456789"
                data-testid="input-edit-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-age">Age</Label>
              <Input
                id="edit-age"
                type="number"
                min={1}
                max={100}
                value={editForm.age || ""}
                onChange={(e) => setEditForm({ ...editForm, age: e.target.value ? parseInt(e.target.value) : undefined })}
                data-testid="input-edit-age"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-emergency-name">Emergency Contact Name</Label>
              <Input
                id="edit-emergency-name"
                value={editForm.emergencyContactName || ""}
                onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                data-testid="input-edit-emergency-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-emergency-phone">Emergency Contact Phone</Label>
              <Input
                id="edit-emergency-phone"
                value={editForm.emergencyContactPhone || ""}
                onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value.replace(/[^0-9+\s\-\(\)]/g, "") })}
                placeholder="07123 456789"
                data-testid="input-edit-emergency-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-experience">Experience Level</Label>
              <Select
                value={editForm.experienceLevel || "beginner"}
                onValueChange={(val) => setEditForm({ ...editForm, experienceLevel: val })}
              >
                <SelectTrigger data-testid="select-edit-experience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { setMemberToEdit(null); setEditForm({}); }} className="w-full sm:w-auto" data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={editMutation.isPending} className="w-full sm:w-auto" data-testid="button-save-edit">
              {editMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{memberToDelete?.name}</strong>?
              </p>
              <p className="text-sm">
                This will permanently remove their account and personal information. 
                Any paid session records will be kept for tax purposes, but with personal details hidden.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
