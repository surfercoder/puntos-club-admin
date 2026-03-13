"use client";

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from "sonner";

import { branchFormAction } from '@/actions/dashboard/branch/branch-form-actions';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { BranchSchema } from '@/schemas/branch.schema';
import type { Branch } from '@/types/branch';

interface BranchFormProps {
  branch?: Branch;
}

export default function BranchForm({ branch }: BranchFormProps) {
  const t = useTranslations('Dashboard.branch.form');
  const tCommon = useTranslations('Common');

  // State
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [addresses, setAddresses] = useState<{ id: string; street: string; city: string }[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>(branch?.address_id ?? '');
  const [isActive, setIsActive] = useState<boolean>(branch?.active ?? true);

  // Utils
  const [actionState, formAction, pending] = useActionState(branchFormAction, EMPTY_ACTION_STATE);
  const { invalidate } = usePlanUsage();

  useEffect(() => {
    if (actionState.status === 'error' && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      try {
        const activeOrgId = document.cookie
          .split('; ')
          .find(row => row.startsWith('active_org_id='))
          ?.split('=')[1];
        
        let addressQuery = supabase.from('address').select('id, street, city').order('street');
        
        if (activeOrgId) {
          const orgIdNumber = Number(activeOrgId);
          if (!Number.isNaN(orgIdNumber)) {
            addressQuery = addressQuery.eq('organization_id', orgIdNumber);
          }
        }
        
        const addressesRes = await addressQuery;

        if (addressesRes.data) {setAddresses(addressesRes.data);}
      } catch (_error) {
        // Silently ignore fetch errors
      }
    };

    fetchData();
  }, []);

  if (actionState.status === 'success') {
    toast.success(actionState.message);
    invalidate();
    redirect("/dashboard/branch");
  }

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
        <Label htmlFor="name">{t('nameLabel')}</Label>
        <Input
          aria-describedby="name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.name}
          defaultValue={branch?.name ?? ''}
          id="name"
          name="name"
          placeholder={t('namePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="name" />
      </div>

      <div>
        <Label htmlFor="address_id">{t('addressLabel')}</Label>
        <select
          id="address_id"
          name="address_id"
          value={selectedAddress}
          onChange={(e) => setSelectedAddress(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="address_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.address_id}
        >
          <option value="">{t('addressPlaceholder')}</option>
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {address.street}, {address.city}
            </option>
          ))}
        </select>
        <FieldError actionState={validation ?? actionState} name="address_id" />
      </div>

      <div>
        <Label htmlFor="phone">{t('phoneLabel')}</Label>
        <Input
          defaultValue={branch?.phone ?? ''}
          id="phone"
          name="phone"
          placeholder={t('phonePlaceholder')}
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <input name="active" type="hidden" value={isActive.toString()} />
      
      <div>
        <Label htmlFor="active">{t('statusLabel')}</Label>
        <select
          id="active"
          value={isActive ? 'true' : 'false'}
          onChange={(e) => setIsActive(e.target.value === 'true')}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-describedby="active-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.active}
        >
          <option value="true">{t('active')}</option>
          <option value="false">{t('inactive')}</option>
        </select>
        <FieldError actionState={validation ?? actionState} name="active" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button asChild type="button" variant="secondary">
          <Link href="/dashboard/branch">{tCommon('cancel')}</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {branch ? tCommon('update') : tCommon('create')}
        </Button>
      </div>
    </form>
  );
}
