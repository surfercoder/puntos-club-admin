import { createClient } from '@/lib/supabase/server';

export default async function TestDBPage() {
  const supabase = await createClient();
  
  // Test queries
  const { data: orgs, error: orgError } = await supabase
    .from('organization')
    .select('*')
    .limit(5);
  
  const { data: roles, error: rolesError } = await supabase
    .from('user_role')
    .select('*');
  
  const { data: appUsers, error: appUsersError } = await supabase
    .from('app_user')
    .select(`
      *,
      organization:organization_id(id, name),
      role:role_id(id, name, display_name)
    `);
  
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Database Connection Test</h1>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-bold">Organizations</h2>
          <p>Count: {orgs?.length || 0}</p>
          {orgError && <p className="text-red-500">Error: {orgError.message}</p>}
          <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(orgs, null, 2)}</pre>
        </div>
        
        <div className="border p-4 rounded">
          <h2 className="font-bold">User Roles</h2>
          <p>Count: {roles?.length || 0}</p>
          {rolesError && <p className="text-red-500">Error: {rolesError.message}</p>}
          <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(roles, null, 2)}</pre>
        </div>
        
        <div className="border p-4 rounded">
          <h2 className="font-bold">App Users</h2>
          <p>Count: {appUsers?.length || 0}</p>
          {appUsersError && <p className="text-red-500">Error: {appUsersError.message}</p>}
          <pre className="text-xs mt-2 overflow-auto max-h-96">{JSON.stringify(appUsers, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
