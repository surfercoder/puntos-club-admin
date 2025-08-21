"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { branchFormAction } from '@/actions/dashboard/branch/branch-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { BranchSchema } from '@/schemas/branch.schema';
import type { Branch } from '@/types/branch';

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

        if (organizationsRes.data) {setOrganizations(organizationsRes.data);}
        if (addressesRes.data) {setAddresses(addressesRes.data);}
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
      {branch?.id && <input name="id" type="hidden" value={branch.id} />}

      <div>
        <Label htmlFor="name">Branch Name</Label>
        <Input
          defaultValue={branch?.name ?? ''}
          id="name"
          name="name"
          placeholder="Enter branch name"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="organization_id">Organization</Label>
        <Select defaultValue={branch?.organization_id ?? ''} name="organization_id">
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
        <Select defaultValue={branch?.address_id ?? 'none'} name="address_id">
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
          defaultValue={branch?.code ?? ''}
          id="code"
          name="code"
          placeholder="Enter branch code (optional)"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="code" />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          defaultValue={branch?.phone ?? ''}
          id="phone"
          name="phone"
          placeholder="Enter phone number (optional)"
          type="tel"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <div>
        <Label htmlFor="active">Status</Label>
        <Select defaultValue={branch?.active !== false ? 'true' : 'false'} name="active">
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
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/branch">Cancel</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {branch ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
