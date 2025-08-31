// Environment verification utility
export function getEnvironmentInfo() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  // Extract project ID from Supabase URL
  const projectId = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  // Known project IDs
  const PRODUCTION_PROJECT_ID = 'yggtzkwoxikrcwoniibh';
  const TEST_PROJECT_ID = 'hcydeiclitorrqpwrtxb';
  
  const environment = projectId === PRODUCTION_PROJECT_ID ? 'PRODUCTION' : 
                     projectId === TEST_PROJECT_ID ? 'TEST' : 
                     'UNKNOWN';

  return {
    environment,
    projectId,
    supabaseUrl,
    siteUrl,
    isProduction: environment === 'PRODUCTION',
    isTest: environment === 'TEST',
    keyPreview: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Not set'
  };
}

export function logEnvironmentInfo() {
  const info = getEnvironmentInfo();
  
  console.warn('🔍 Environment Check:');
  console.warn(`📍 Environment: ${info.environment}`);
  console.warn(`🆔 Project ID: ${info.projectId}`);
  console.warn(`🌐 Supabase URL: ${info.supabaseUrl}`);
  console.warn(`🔑 API Key: ${info.keyPreview}`);
  console.warn(`🏠 Site URL: ${info.siteUrl}`);
  
  if (info.isProduction) {
    console.warn('⚠️  WARNING: Connected to PRODUCTION database!');
  } else if (info.isTest) {
    console.warn('✅ Connected to TEST database');
  } else {
    console.warn('❓ Unknown environment detected');
  }
  
  return info;
}
