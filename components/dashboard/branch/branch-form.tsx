"use client";

import { useActionState, useState, useEffect } from 'react';
import { branchFormAction } from '@/actions/dashboard/branch/branch-form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionState, EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import FieldError from '@/components/ui/field-error';
import { Branch } from '@/types/branch';
import { BranchSchema } from '@/schemas/branch.schema';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BranchFormProps {
  branch?: Branch;
}

export default function BranchForm({ branch }: BranchFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [addresses, setAddresses] = useState<{ id: string; street: string; city: string }[]>([]);

  // Utils
  const [actionState, formAction, pending] = useActionState(branchFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/branch");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const [organizationsRes, addressesRes] = await Promise.all([
          supabase.from('organization').select('id, name'),
          supabase.from('address').select('id, street, city'),
        ]);

        if (organizationsRes.data) setOrganizations(organizationsRes.data);
        if (addressesRes.data) setAddresses(addressesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      BranchSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {branch?.id && <input type="hidden" name="id" value={branch.id} />}

      <div>
        <Label htmlFor="name">Branch Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={branch?.name ?? ''}
          placeholder="Enter branch name"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="organization_id">Organization</Label>
        <Select name="organization_id" defaultValue={branch?.organization_id ?? ''}>
          <SelectTrigger>
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organization.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="address_id">Address (Optional)</Label>
        <Select name="address_id" defaultValue={branch?.address_id ?? 'none'}>
          <SelectTrigger>
            <SelectValue placeholder="Select an address" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No address</SelectItem>
            {addresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                {address.street}, {address.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="address_id" />
      </div>

      <div>
        <Label htmlFor="code">Branch Code</Label>
        <Input
          id="code"
          name="code"
          type="text"
          defaultValue={branch?.code ?? ''}
          placeholder="Enter branch code (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="code" />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={branch?.phone ?? ''}
          placeholder="Enter phone number (optional)"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <div>
        <Label htmlFor="active">Status</Label>
        <Select name="active" defaultValue={branch?.active !== false ? 'true' : 'false'}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="flex gap-2">
        <Button asChild variant="secondary" className="w-full" type="button">
          <Link href="/dashboard/branch">Cancel</Link>
        </Button>
        <Button type="submit" className="w-full" disabled={pending}>
          {branch ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
