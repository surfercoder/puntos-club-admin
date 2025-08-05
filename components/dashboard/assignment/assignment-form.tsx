'use client';

import { useActionState, useState, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { assignmentFormAction } from '@/actions/dashboard/assignment/assignment-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { AssignmentSchema } from '@/schemas/assignment.schema';
import { toast } from "sonner"
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AssignmentForm({ assignment }: { assignment?: Assignment }) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  // Utils
  const [actionState, formAction, pending] = useActionState(assignmentFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();
  const supabase = createClient();

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesRes, beneficiariesRes, usersRes] = await Promise.all([
          supabase.from('branch').select('id, name'),
          supabase.from('beneficiary').select('id, first_name, last_name'),
          supabase.from('app_user').select('id, first_name, last_name')
        ]);

        if (branchesRes.data) setBranches(branchesRes.data);
        if (beneficiariesRes.data) setBeneficiaries(beneficiariesRes.data);
        if (usersRes.data) setUsers(usersRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [supabase]);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/assignment");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      // Create a copy for validation with proper types
      const validationData: Record<string, unknown> = { ...formData };
      // Convert points to number for validation
      if (validationData.points && typeof validationData.points === 'string') {
        validationData.points = Number(validationData.points);
      }
      AssignmentSchema.parse(validationData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  // Render
  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {assignment?.id && <input type="hidden" name="id" value={String(assignment.id)} />}
      
      <div className="space-y-2">
        <Label htmlFor="branch_id">Branch</Label>
        <Select name="branch_id" defaultValue={assignment?.branch_id ?? ''}>
          <SelectTrigger>
            <SelectValue placeholder="Select a branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="branch_id" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="beneficiary_id">Beneficiary</Label>
        <Select name="beneficiary_id" defaultValue={assignment?.beneficiary_id ?? ''}>
          <SelectTrigger>
            <SelectValue placeholder="Select a beneficiary" />
          </SelectTrigger>
          <SelectContent>
            {beneficiaries.map((beneficiary) => (
              <SelectItem key={beneficiary.id} value={beneficiary.id}>
                {beneficiary.first_name} {beneficiary.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="user_id">Assigned By (Optional)</Label>
        <Select name="user_id" defaultValue={assignment?.user_id ?? 'system'}>
          <SelectTrigger>
            <SelectValue placeholder="Select a user (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="user_id" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Points</Label>
        <Input
          id="points"
          name="points"
          type="number"
          min="1"
          defaultValue={assignment?.points ?? ''}
          aria-invalid={!!actionState.fieldErrors.points}
          aria-describedby="points-error"
        />
        <FieldError actionState={validation ?? actionState} name="points" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason (Optional)</Label>
        <Input
          id="reason"
          name="reason"
          defaultValue={assignment?.reason ?? ''}
          aria-invalid={!!actionState.fieldErrors.reason}
          aria-describedby="reason-error"
          placeholder="Reason for point assignment"
        />
        <FieldError actionState={validation ?? actionState} name="reason" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment_date">Assignment Date</Label>
        <Input
          id="assignment_date"
          name="assignment_date"
          type="date"
          defaultValue={assignment?.assignment_date ? new Date(assignment.assignment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
          aria-invalid={!!actionState.fieldErrors.assignment_date}
          aria-describedby="assignment_date-error"
        />
        <FieldError actionState={validation ?? actionState} name="assignment_date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observations (Optional)</Label>
        <Textarea
          id="observations"
          name="observations"
          defaultValue={assignment?.observations ?? ''}
          aria-invalid={!!actionState.fieldErrors.observations}
          aria-describedby="observations-error"
          placeholder="Additional observations or notes"
          rows={3}
        />
        <FieldError actionState={validation ?? actionState} name="observations" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <a href="/dashboard/assignment">Cancel</a>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {assignment ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
