"use client";

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { getAllUsers } from '@/actions/dashboard/user/actions';
import DeleteModal from '@/components/dashboard/user/delete-modal';
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
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        if (isAdmin) {
          // Admins see all users without organization filter
          const fetchedUsers = await getAllUsers();
          setUsers(fetchedUsers);
        } else if (isOwner) {
          // Owners see users from their active organization
          const activeOrgId = typeof window !== "undefined"
            ? window.localStorage.getItem("active_org_id")
            : null;
          
          if (activeOrgId) {
            const fetchedUsers = await getAllUsers(activeOrgId);
            setUsers(fetchedUsers);
          }
        }
      } catch (_error) {
        // Silently ignore fetch errors
      } finally {
        setIsLoading(false);
      }
    }

    // Listen for custom event from org switcher (only relevant for owners)
    const handleOrgChange = () => {
      if (isOwner && !isAdmin) {
        // Small delay to ensure localStorage is updated
        setTimeout(() => {
          fetchUsers();
        }, 100);
      }
    };

    if (isOwner && !isAdmin) {
      window.addEventListener('orgChanged', handleOrgChange);
    }

    // Fetch on mount to ensure we have the latest
    if (isAdmin || isOwner) {
      fetchUsers();
    }

    return () => {
      if (isOwner && !isAdmin) {
        window.removeEventListener('orgChanged', handleOrgChange);
      }
    };
  }, [isOwner, isAdmin]);

  return (
    <div className="border rounded-lg">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Loading users...</div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role?.name === 'admin'
                      ? 'bg-red-100 text-red-800'
                      : user.role?.name === 'owner'
                      ? 'bg-blue-100 text-blue-800'
                      : user.role?.name === 'collaborator'
                      ? 'bg-teal-100 text-teal-800'
                      : user.role?.name === 'cashier'
                      ? 'bg-orange-100 text-orange-800'
                      : user.role?.name === 'final_user'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role?.display_name || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>{user.organization?.name || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.user_type === 'beneficiary' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.user_type === 'beneficiary' ? 'Beneficiary' : 'App User'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}
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
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="text-center py-4" colSpan={8}>No users found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
