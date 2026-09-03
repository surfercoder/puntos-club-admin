import type { ReactNode } from 'react';

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ListTableHeaderColumn {
  label: ReactNode;
  className?: string;
}

// Shared shape for the "single header row of TableHead cells" pattern
// repeated across most dashboard list pages.
export function ListTableHeader({ columns }: { columns: ListTableHeaderColumn[] }) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead className={column.className} key={String(column.label)}>
            {column.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
