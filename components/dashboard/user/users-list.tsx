"use client";

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { getAllUsers } from '@/actions/dashboard/user/actions';
import DeleteModal from '@/components/dashboard/user/delete-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type User = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  active: boolean;
  created_at: string;
  user_type: 'app_user' | 'beneficiary';
  role?: {
    name: string;
    display_name: string;
  };
  organization?: {
    id: string;
    name: string;
  };
};

interface UsersListProps {
  initialUsers: User[];
  isOwner: boolean;
  isAdmin: boolean;
}

export function UsersList({ initialUsers, isOwner, isAdmin }: UsersListProps) {
  const t = useTranslations('Dashboard.users');
  const tCommon = useTranslations('Common');

  const [state, setState] = useState<{ users: User[]; isLoading: boolean }>(() => ({
    users: initialUsers,
    isLoading: false,
  }));
  const { users, isLoading } = state;

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      let fetchedUsers: User[] | null = null;
      try {
        if (isAdmin) {
          fetchedUsers = await getAllUsers();
        } else if (isOwner) {
          const activeOrgId = typeof window !== "undefined"
            ? window.localStorage.getItem("active_org_id")
            : null;

          if (activeOrgId) {
            fetchedUsers = await getAllUsers(activeOrgId);
          }
        }
      } catch {
        // keep current users on error
      }
      if (!cancelled) {
        setState((prev) => ({
          users: fetchedUsers ?? prev.users,
          isLoading: false,
        }));
      }
    }

    const handleOrgChange = () => {
      if (isOwner && !isAdmin) {
        setTimeout(() => {
          fetchUsers();
        }, 100);
      }
    };

    if (isOwner && !isAdmin) {
      window.addEventListener('orgChanged', handleOrgChange);
    }

    if (isAdmin || isOwner) {
      fetchUsers();
    }

    return () => {
      cancelled = true;
      if (isOwner && !isAdmin) {
        window.removeEventListener('orgChanged', handleOrgChange);
      }
    };
  }, [isOwner, isAdmin]);

  return (
    <div className="border rounded-lg">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">{t('loading')}</div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tableHeaders.name')}</TableHead>
            <TableHead>{t('tableHeaders.email')}</TableHead>
            <TableHead>{t('tableHeaders.role')}</TableHead>
            <TableHead>{t('tableHeaders.organization')}</TableHead>
            <TableHead>{t('tableHeaders.type')}</TableHead>
            <TableHead>{t('tableHeaders.status')}</TableHead>
            <TableHead>{t('tableHeaders.created')}</TableHead>
            <TableHead className="text-right">{tCommon('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users && users.length > 0 ? (
            users.map((user) => (
              <TableRow key={`${user.user_type}-${user.id}`}>
                <TableCell className="font-medium">
                  {user.first_name || user.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'N/A'
                  }
                </TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {user.role?.display_name || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>{user.organization?.name || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {user.user_type === 'beneficiary' ? t('typeBeneficiary') : t('typeAppUser')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? 'default' : 'destructive'}>
                    {user.active ? t('statusActive') : t('statusInactive')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/dashboard/users/edit/${user.id}?type=${user.user_type}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteModal
                      userId={user.id}
                      userName={
                        user.first_name || user.last_name
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'Unnamed User'
                      }
                      userType={user.user_type}
                      onDeleted={() => {
                        setState((prev) => ({
                          ...prev,
                          users: prev.users.filter((u) => u.id !== user.id),
                        }));
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="text-center py-4" colSpan={8}>{t('empty')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
