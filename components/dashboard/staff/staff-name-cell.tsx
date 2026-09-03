import { TableCell } from '@/components/ui/table';
import { staffInitials } from '@/lib/staff/get-staff';

// Shared "avatar + name + email" table cell used by the cashiers and
// collaborators staff list pages.
export function StaffNameCell({ name, email }: { name: string; email: string | null }) {
  return (
    <TableCell>
      <span className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-violet/10 text-[11px] font-semibold text-brand-violet">
          {staffInitials(name)}
        </span>
        <span className="min-w-0">
          <span className="block font-medium">{name || 'N/A'}</span>
          <span className="block text-xs text-muted-foreground">{email}</span>
        </span>
      </span>
    </TableCell>
  );
}
