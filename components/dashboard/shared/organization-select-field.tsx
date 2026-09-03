import FieldError from '@/components/ui/field-error';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionState } from '@/lib/error-handler';

interface OrganizationOption {
  id: string;
  name: string;
}

interface OrganizationSelectFieldProps {
  organizations: OrganizationOption[];
  defaultValue: string;
  label: string;
  placeholder: string;
  actionState: ActionState;
}

// Shared "pick an organization" field, repeated across the entity forms
// that link a record to an organization.
export function OrganizationSelectField({
  organizations,
  defaultValue,
  label,
  placeholder,
  actionState,
}: OrganizationSelectFieldProps) {
  return (
    <div>
      <Label htmlFor="organization_id">{label}</Label>
      <Select defaultValue={defaultValue} name="organization_id">
        <SelectTrigger id="organization_id">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError actionState={actionState} name="organization_id" />
    </div>
  );
}
