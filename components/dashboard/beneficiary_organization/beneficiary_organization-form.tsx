"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { beneficiaryOrganizationFormAction } from '@/actions/dashboard/beneficiary_organization/beneficiary_organization-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { createClient } from '@/lib/supabase/client';
import { BeneficiaryOrganizationSchema } from '@/schemas/beneficiary_organization.schema';
import type { BeneficiaryOrganization } from '@/schemas/beneficiary_organization.schema';

interface BeneficiaryOrganizationFormProps {
  beneficiaryOrganization?: BeneficiaryOrganization;
}

interface BeneficiaryOption {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface OrganizationOption {
  id: string;
  name: string;
}

export default function BeneficiaryOrganizationForm({ beneficiaryOrganization }: BeneficiaryOrganizationFormProps) {
  const [validation, setValidation] = useState<ActionState | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryOption[]>([]);
  const [orgs, setOrgs] = useState<OrganizationOption[]>([]);

  const [actionState, formAction, pending] = useActionState(beneficiaryOrganizationFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [beneficiariesResult, orgsResult] = await Promise.all([
        supabase.from('beneficiary').select('id, first_name, last_name, email').order('first_name'),
        supabase.from('organization').select('id, name').order('name'),
      ]);

      if (beneficiariesResult.data) setBeneficiaries(beneficiariesResult.data);
      if (orgsResult.data) setOrgs(orgsResult.data);
    }

    loadData();
  }, []);

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push('/dashboard/beneficiary_organization');
      }, 500);
    }
  }, [actionState, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      BeneficiaryOrganizationSchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {beneficiaryOrganization?.id && <input name="id" type="hidden" value={beneficiaryOrganization.id} />}

      <div>
        <Label htmlFor="beneficiary_id">Beneficiario</Label>
        <Select defaultValue={beneficiaryOrganization?.beneficiary_id ?? ''} name="beneficiary_id">
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar un beneficiario" />
          </SelectTrigger>
          <SelectContent>
            {beneficiaries.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.first_name || b.last_name ? `${b.first_name || ''} ${b.last_name || ''}`.trim() : b.email || 'Sin nombre'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="beneficiary_id" />
      </div>

      <div>
        <Label htmlFor="organization_id">Organización</Label>
        <Select defaultValue={beneficiaryOrganization?.organization_id ?? ''} name="organization_id">
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar una organización" />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError actionState={validation ?? actionState} name="organization_id" />
      </div>

      <div>
        <Label htmlFor="available_points">Puntos Disponibles</Label>
        <Input
          aria-describedby="available_points-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.available_points}
          defaultValue={beneficiaryOrganization?.available_points ?? 0}
          id="available_points"
          name="available_points"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="available_points" />
      </div>

      <div>
        <Label htmlFor="total_points_earned">Puntos Totales Acumulados</Label>
        <Input
          aria-describedby="total_points_earned-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.total_points_earned}
          defaultValue={beneficiaryOrganization?.total_points_earned ?? 0}
          id="total_points_earned"
          name="total_points_earned"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="total_points_earned" />
      </div>

      <div>
        <Label htmlFor="total_points_redeemed">Puntos Totales Canjeados</Label>
        <Input
          aria-describedby="total_points_redeemed-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.total_points_redeemed}
          defaultValue={beneficiaryOrganization?.total_points_redeemed ?? 0}
          id="total_points_redeemed"
          name="total_points_redeemed"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="total_points_redeemed" />
      </div>

      <div className="flex items-center space-x-2">
        <input
          className="rounded"
          defaultChecked={beneficiaryOrganization?.is_active ?? true}
          id="is_active"
          name="is_active"
          type="checkbox"
        />
        <Label htmlFor="is_active">Activo</Label>
        <FieldError actionState={validation ?? actionState} name="is_active" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/beneficiary_organization">Cancelar</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {beneficiaryOrganization ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
