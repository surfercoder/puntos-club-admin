#!/usr/bin/env node

// Simple Node.js script to verify environment configuration
// Run with: node scripts/verify-environment.js

import fs from 'fs';

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key] = valueParts.join('=');
        }
      }
    });
    
    return env;
  } catch {
    return null;
  }
}

function extractProjectId(url) {
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

function main() {
  console.warn('🔍 Environment Verification Script');
  console.warn('==================================\n');

  // Known project IDs
  const PRODUCTION_PROJECT_ID = 'yggtzkwoxikrcwoniibh';
  const TEST_PROJECT_ID = 'hcydeiclitorrqpwrtxb';

  // Check .env.local file
  const envLocal = loadEnvFile('.env.local');
  
  if (!envLocal) {
    console.error('❌ .env.local file not found');
    console.error('📝 Create .env.local file with:');
    console.error('   cp .env.example .env.local');
    console.error('   # Edit with your test project credentials\n');
    return;
  }

  const supabaseUrl = envLocal.NEXT_PUBLIC_SUPABASE_URL;
  const projectId = extractProjectId(supabaseUrl);
  
  console.warn('📁 .env.local Configuration:');
  console.warn(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  console.warn(`   Project ID: ${projectId}`);
  console.warn(`   Site URL: ${envLocal.NEXT_PUBLIC_SITE_URL}`);
  
  if (envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const keyPreview = envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...';
    console.warn(`   API Key: ${keyPreview}`);
  }
  
  console.warn('');

  // Determine environment
  let environment = 'UNKNOWN';
  let status = '❓';
  
  if (projectId === PRODUCTION_PROJECT_ID) {
    environment = 'PRODUCTION';
    status = '⚠️';
  } else if (projectId === TEST_PROJECT_ID) {
    environment = 'TEST';
    status = '✅';
  }

  console.warn(`${status} Environment: ${environment}`);
  
  if (environment === 'PRODUCTION') {
    console.error('');
    console.error('🚨 WARNING: You are connected to the PRODUCTION database!');
    console.error('   This could affect live user data.');
    console.error('   Switch to test environment:');
    console.error('   1. Update .env.local with test project credentials');
    console.error('   2. Restart your development server');
  } else if (environment === 'TEST') {
    console.warn('');
    console.warn('🎉 Great! You are safely connected to the TEST database.');
    console.warn('   You can develop and test without affecting production data.');
  } else {
    console.warn('');
    console.warn('❓ Unknown project detected.');
    console.warn('   Expected project IDs:');
    console.warn(`   - Production: ${PRODUCTION_PROJECT_ID}`);
    console.warn(`   - Test: ${TEST_PROJECT_ID}`);
  }

  // Check for other env files
  console.warn('\n📋 Other Environment Files:');
  
  const envFiles = ['.env.test', '.env.production', '.env.example'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const env = loadEnvFile(file);
      const url = env?.NEXT_PUBLIC_SUPABASE_URL;
      const id = extractProjectId(url);
      console.warn(`   ${file}: ${id || 'No URL found'}`);
    } else {
      console.warn(`   ${file}: Not found`);
    }
  });

  console.warn('\n✨ Verification complete!');
}

main();
