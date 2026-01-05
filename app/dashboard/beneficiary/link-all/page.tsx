"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { linkAllUnlinkedBeneficiaries } from '@/actions/dashboard/beneficiary/link-to-organization';

export default function LinkAllBeneficiariesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  const handleLinkAll = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await linkAllUnlinkedBeneficiaries();

      if (error) {
        setResult({
          success: false,
          message: error.message || 'Failed to link beneficiaries',
        });
      } else {
        setResult({
          success: true,
          message: data?.message || 'Successfully linked beneficiaries',
        });
      }
    } catch {
      setResult({
        success: false,
        message: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Link Unlinked Beneficiaries</CardTitle>
          <CardDescription>
            This utility will link all beneficiaries that are not currently associated with your organization.
            This is useful for fixing beneficiaries created before the automatic linking was implemented.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <p>{result.message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleLinkAll}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Linking...' : 'Link All Unlinked Beneficiaries'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard/beneficiary')}
              disabled={loading}
            >
              Back to Beneficiaries
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">What this does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Finds all beneficiaries not linked to your organization</li>
              <li>Creates beneficiary_organization records for them</li>
              <li>Sets their initial points to 0</li>
              <li>Makes them active members of your organization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
