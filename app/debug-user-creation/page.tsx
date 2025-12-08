'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DebugUserCreationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDirectInsert = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-create-user');
      const data = await response.json();
      setResult({ type: 'Direct Insert Test', data });
    } catch (error: any) {
      setResult({ type: 'Error', data: error.message });
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/find-user?email=fede@owner.com');
      const data = await response.json();
      setResult({ type: 'Search for fede@owner.com', data });
    } catch (error: any) {
      setResult({ type: 'Error', data: error.message });
    } finally {
      setLoading(false);
    }
  };

  const queryAllUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-query-users');
      const data = await response.json();
      setResult({ type: 'Query All Users', data });
    } catch (error: any) {
      setResult({ type: 'Error', data: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Debug User Creation</h1>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Issue:</h2>
          <p>User <code className="bg-gray-100 px-2 py-1 rounded">fede@owner.com</code> is not appearing in the users list.</p>
        </div>

        <div className="border p-4 rounded space-y-2">
          <h2 className="font-bold mb-2">Tests:</h2>
          
          <Button onClick={testDirectInsert} disabled={loading} className="w-full">
            1. Test Direct Insert (Create Test User)
          </Button>
          
          <Button onClick={searchUser} disabled={loading} className="w-full" variant="secondary">
            2. Search for fede@owner.com
          </Button>
          
          <Button onClick={queryAllUsers} disabled={loading} className="w-full" variant="secondary">
            3. Query All Users
          </Button>
        </div>

        {result && (
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">{result.type}</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="border border-yellow-500 bg-yellow-50 p-4 rounded">
          <h2 className="font-bold mb-2 text-yellow-800">⚠️ Most Likely Issue: RLS</h2>
          <p className="text-sm mb-2">Row Level Security is blocking queries. Run this in Supabase SQL Editor:</p>
          <pre className="bg-white p-2 rounded text-xs border">
{`ALTER TABLE app_user DISABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_role DISABLE ROW LEVEL SECURITY;`}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Next Steps:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Run the SQL above in Supabase Dashboard → SQL Editor</li>
            <li>Click "Test Direct Insert" above to create a test user</li>
            <li>Click "Query All Users" to see if it appears</li>
            <li>If test user appears, try creating fede@owner.com again via the form</li>
            <li>Click "Search for fede@owner.com" to verify it was created</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
