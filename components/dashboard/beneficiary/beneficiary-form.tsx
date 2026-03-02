"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useState, useEffect } from 'react';
import { toast } from "sonner";

import { beneficiaryFormAction } from '@/actions/dashboard/beneficiary/beneficiary-form-actions';
import { Button } from '@/components/ui/button';
import FieldError from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ActionState} from '@/lib/error-handler';
import { EMPTY_ACTION_STATE, fromErrorToActionState } from '@/lib/error-handler';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';
import type { Beneficiary } from '@/types/beneficiary';

interface BeneficiaryFormProps {
  beneficiary?: Beneficiary;
}

export default function BeneficiaryForm({ beneficiary }: BeneficiaryFormProps) {
  // State
  const [validation, setValidation] = useState<ActionState | null>(null);

  // Utils
  const [actionState, formAction, pending] = useActionState(beneficiaryFormAction, EMPTY_ACTION_STATE);
  const router = useRouter();

  useEffect(() => {
    if (actionState.message) {
      toast.success(actionState.message);
      setTimeout(() => {
        router.push("/dashboard/beneficiary");
      }, 500); // Show toast briefly before navigating
    }
  }, [actionState, router]);

  // Handlers
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = Object.fromEntries(new FormData(event.currentTarget));
    setValidation(null);

    try {
      BeneficiarySchema.parse(formData);
    } catch (error) {
      setValidation(fromErrorToActionState(error));
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
      {beneficiary?.id && <input name="id" type="hidden" value={beneficiary.id} />}
      <div>
        <Label htmlFor="first_name">Nombre</Label>
        <Input
          aria-describedby="first_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.first_name}
          defaultValue={beneficiary?.first_name ?? ''}
          id="first_name"
          name="first_name"
          placeholder="Ingresa el nombre"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="first_name" />
      </div>

      <div>
        <Label htmlFor="last_name">Apellido</Label>
        <Input
          aria-describedby="last_name-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.last_name}
          defaultValue={beneficiary?.last_name ?? ''}
          id="last_name"
          name="last_name"
          placeholder="Ingresa el apellido"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="last_name" />
      </div>

      <div>
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          aria-describedby="email-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.email}
          defaultValue={beneficiary?.email ?? ''}
          id="email"
          name="email"
          placeholder="Ingresa el correo electrónico"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="email" />
      </div>

      <div>
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          aria-describedby="phone-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.phone}
          defaultValue={beneficiary?.phone ?? ''}
          id="phone"
          name="phone"
          placeholder="Ingresa el número de teléfono"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="phone" />
      </div>

      <div>
        <Label htmlFor="document_id">DNI / RUT</Label>
        <Input
          aria-describedby="document_id-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.document_id}
          defaultValue={beneficiary?.document_id ?? ''}
          id="document_id"
          name="document_id"
          placeholder="Ingresa el DNI o RUT"
          type="text"
        />
        <FieldError actionState={validation ?? actionState} name="document_id" />
      </div>

      <div>
        <Label htmlFor="available_points">Puntos Disponibles</Label>
        <Input
          aria-describedby="available_points-error"
          aria-invalid={!!(validation ?? actionState).fieldErrors?.available_points}
          defaultValue={beneficiary?.available_points ?? 0}
          id="available_points"
          name="available_points"
          placeholder="Ingresa los puntos disponibles"
          type="number"
        />
        <FieldError actionState={validation ?? actionState} name="available_points" />
      </div>

      <div className="flex gap-2">
        <Button asChild className="w-full" type="button" variant="secondary">
          <Link href="/dashboard/beneficiary">Cancelar</Link>
        </Button>
        <Button className="w-full" disabled={pending} type="submit">
          {beneficiary ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}
