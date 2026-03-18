'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { ProfileSchema } from '@/schemas/auth.schema';
import type { AppUserWithRelations } from '@/types/app_user';

type ProfileFormProps = {
  user: AppUserWithRelations;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const t = useTranslations('Dashboard.profile');
  const tCommon = useTranslations('Common');

  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    username: user.username || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = ProfileSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = String(issue.path[0]);
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('app_user')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: formData.username /* c8 ignore next */ || null,
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) {
          throw emailError;
        }
      }

      toast.success(tCommon('saveChanges'));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{t('section')}</CardTitle>
          <CardDescription>{t('sectionDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">{tCommon('name')}</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                aria-invalid={!!fieldErrors.first_name}
                aria-describedby="first_name-error"
              />
              {fieldErrors.first_name && (
                <p id="first_name-error" className="text-destructive text-sm">
                  {fieldErrors.first_name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{tCommon('lastName')}</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                aria-invalid={!!fieldErrors.last_name}
                aria-describedby="last_name-error"
              />
              {fieldErrors.last_name && (
                <p id="last_name-error" className="text-destructive text-sm">
                  {fieldErrors.last_name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{tCommon('email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              aria-invalid={!!fieldErrors.email}
              aria-describedby="email-error"
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-destructive text-sm">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{t('username')}</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              aria-invalid={!!fieldErrors.username}
              aria-describedby="username-error"
            />
            {fieldErrors.username && (
              <p id="username-error" className="text-destructive text-sm">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('organization')}</Label>
            <Input
              value={user.organization?.name || 'N/A'}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('role')}</Label>
            <Input
              value={user.role?.display_name || user.role?.name || 'N/A'}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? tCommon('savingChanges') : tCommon('saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
