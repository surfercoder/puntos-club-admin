import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanDatabase() {
  console.log('Cleaning existing data...\n');

  const tables = [
    'history',
    'redemption',
    'app_order',
    'status',
    'assignment',
    'stock',
    'product',
    'subcategory',
    'category',
    'user_permission',
    'collaborator_permission',
    'beneficiary',
    'app_user',
    'branch',
    'address',
    'organization',
  ];

  for (const table of tables) {
    try {
      // Get all records first
      const { data: records } = await supabase.from(table).select('id');

      if (records && records.length > 0) {
        // Delete each record by ID
        const ids = records.map(r => r.id);
        await supabase.from(table).delete().in('id', ids);
        console.log(`✓ Cleaned ${records.length} records from ${table}`);
      }
    } catch (error) {
      console.log(`- No records to clean from ${table}`);
    }
  }

  console.log('\n');
}

async function seedDatabase() {
  console.log('Starting database seeding...\n');

  try {
    // Clean existing data first
    await cleanDatabase();
    
    // 0. Fetch User Roles (these are created by migration)
    console.log('Fetching User Roles...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_role')
      .select('*');
    
    if (rolesError) throw rolesError;
    if (!roles || roles.length === 0) {
      throw new Error('No roles found. Please run migrations first.');
    }
    
    const roleMap = {
      final_user: roles.find(r => r.name === 'final_user')?.id,
      cashier: roles.find(r => r.name === 'cashier')?.id,
      owner: roles.find(r => r.name === 'owner')?.id,
      collaborator: roles.find(r => r.name === 'collaborator')?.id,
      admin: roles.find(r => r.name === 'admin')?.id,
    };
    console.log(`✓ Found ${roles.length} roles\n`);
    
    // 1. Seed Organizations
    console.log('Seeding Organizations...');
    const { data: organizations, error: orgError } = await supabase
      .from('organization')
      .insert([
        {
          name: 'Acme Corporation',
          business_name: 'Acme Corp LLC',
          tax_id: '12-3456789',
        },
        {
          name: 'Global Rewards Inc',
          business_name: 'Global Rewards Incorporated',
          tax_id: '98-7654321',
        },
        {
          name: 'Best Benefits Co',
          business_name: 'Best Benefits Company',
          tax_id: '45-6789012',
        },
      ])
      .select();

    if (orgError) throw orgError;
    console.log(`✓ Created ${organizations.length} organizations\n`);

    const org1Id = organizations[0].id;
    const org2Id = organizations[1].id;

    // 2. Seed Addresses
    console.log('Seeding Addresses...');
    const { data: addresses, error: addressError } = await supabase
      .from('address')
      .insert([
        {
          street: 'Main Street',
          number: '123',
          city: 'New York',
          state: 'NY',
          zip_code: '10001',
        },
        {
          street: 'Oak Avenue',
          number: '456',
          city: 'Los Angeles',
          state: 'CA',
          zip_code: '90001',
        },
        {
          street: 'Elm Drive',
          number: '789',
          city: 'Chicago',
          state: 'IL',
          zip_code: '60601',
        },
        {
          street: 'Pine Boulevard',
          number: '321',
          city: 'Houston',
          state: 'TX',
          zip_code: '77001',
        },
      ])
      .select();

    if (addressError) throw addressError;
    console.log(`✓ Created ${addresses.length} addresses\n`);

    // 3. Seed Branches
    console.log('Seeding Branches...');
    const { data: branches, error: branchError } = await supabase
      .from('branch')
      .insert([
        {
          organization_id: org1Id,
          address_id: addresses[0].id,
          name: 'Main Branch',
          code: 'MB-001',
          phone: '+1-555-0101',
          active: true,
        },
        {
          organization_id: org1Id,
          address_id: addresses[1].id,
          name: 'West Coast Branch',
          code: 'WC-002',
          phone: '+1-555-0102',
          active: true,
        },
        {
          organization_id: org2Id,
          address_id: addresses[2].id,
          name: 'Central Hub',
          code: 'CH-001',
          phone: '+1-555-0201',
          active: true,
        },
        {
          organization_id: org2Id,
          address_id: addresses[3].id,
          name: 'Southern Branch',
          code: 'SB-002',
          phone: '+1-555-0202',
          active: false,
        },
      ])
      .select();

    if (branchError) throw branchError;
    console.log(`✓ Created ${branches.length} branches\n`);

    const branch1Id = branches[0].id;
    const branch2Id = branches[1].id;
    const branch3Id = branches[2].id;

    // 4. Seed App Users (with different roles)
    console.log('Seeding App Users...');
    const { data: appUsers, error: userError } = await supabase
      .from('app_user')
      .insert([
        {
          organization_id: org1Id,
          first_name: 'Agustin',
          last_name: 'Cassani',
          email: 'agustin@puntosclub.com',
          username: 'agustin',
          password: 'hashedpassword123',
          active: true,
          role_id: roleMap.admin,
        },
        {
          organization_id: org1Id,
          first_name: 'Charly',
          last_name: 'Admin',
          email: 'charly@puntosclub.com',
          username: 'charly',
          password: 'hashedpassword456',
          active: true,
          role_id: roleMap.admin,
        },
        {
          organization_id: org1Id,
          first_name: 'Fede',
          last_name: 'Admin',
          email: 'fede@puntosclub.com',
          username: 'fede',
          password: 'hashedpassword789',
          active: true,
          role_id: roleMap.admin,
        },
        {
          organization_id: org1Id,
          first_name: 'John',
          last_name: 'Owner',
          email: 'john.owner@acme.com',
          username: 'johnowner',
          password: 'hashedpassword111',
          active: true,
          role_id: roleMap.owner,
        },
        {
          organization_id: org1Id,
          first_name: 'Jane',
          last_name: 'Cashier',
          email: 'jane.cashier@acme.com',
          username: 'janecashier',
          password: 'hashedpassword222',
          active: true,
          role_id: roleMap.cashier,
        },
        {
          organization_id: org2Id,
          first_name: 'Bob',
          last_name: 'Owner',
          email: 'bob.owner@global.com',
          username: 'bobowner',
          password: 'hashedpassword333',
          active: true,
          role_id: roleMap.owner,
        },
        {
          organization_id: org2Id,
          first_name: 'Alice',
          last_name: 'Collaborator',
          email: 'alice.collab@global.com',
          username: 'alicecollab',
          password: 'hashedpassword444',
          active: true,
          role_id: roleMap.collaborator,
        },
      ])
      .select();

    if (userError) throw userError;
    console.log(`✓ Created ${appUsers.length} app users\n`);

    // Map users by role for easier reference
    const adminUser1 = appUsers[0]; // Agustin
    const adminUser2 = appUsers[1]; // Charly
    const adminUser3 = appUsers[2]; // Fede
    const ownerUser1 = appUsers[3]; // John Owner
    const cashierUser1 = appUsers[4]; // Jane Cashier
    const ownerUser2 = appUsers[5]; // Bob Owner
    const collaboratorUser1 = appUsers[6]; // Alice Collaborator
    
    // Set created_by for collaborator (created by owner)
    await supabase
      .from('app_user')
      .update({ created_by: ownerUser2.id })
      .eq('id', collaboratorUser1.id);
    
    console.log('✓ Updated collaborator created_by relationship\n');

    // 5. Seed Beneficiaries
    console.log('Seeding Beneficiaries...');
    const { data: beneficiaries, error: beneficiaryError } = await supabase
      .from('beneficiary')
      .insert([
        {
          first_name: 'Michael',
          last_name: 'Brown',
          email: 'michael.brown@email.com',
          phone: '+1-555-1001',
          document_id: 'DL-12345678',
          available_points: 1000,
          role_id: roleMap.final_user,
        },
        {
          first_name: 'Sarah',
          last_name: 'Davis',
          email: 'sarah.davis@email.com',
          phone: '+1-555-1002',
          document_id: 'DL-87654321',
          available_points: 2500,
          role_id: roleMap.final_user,
        },
        {
          first_name: 'David',
          last_name: 'Wilson',
          email: 'david.wilson@email.com',
          phone: '+1-555-1003',
          document_id: 'DL-11223344',
          available_points: 500,
          role_id: roleMap.final_user,
        },
        {
          first_name: 'Emma',
          last_name: 'Martinez',
          email: 'emma.martinez@email.com',
          phone: '+1-555-1004',
          document_id: 'DL-44332211',
          available_points: 3000,
          role_id: roleMap.final_user,
        },
        {
          first_name: 'James',
          last_name: 'Garcia',
          email: 'james.garcia@email.com',
          phone: '+1-555-1005',
          document_id: 'DL-55667788',
          available_points: 750,
          role_id: roleMap.final_user,
        },
      ])
      .select();

    if (beneficiaryError) throw beneficiaryError;
    console.log(`✓ Created ${beneficiaries.length} beneficiaries\n`);

    const beneficiary1Id = beneficiaries[0].id;
    const beneficiary2Id = beneficiaries[1].id;
    const beneficiary3Id = beneficiaries[2].id;

    // 6. Seed User Permissions
    console.log('Seeding User Permissions...');
    const { data: permissions, error: permissionError } = await supabase
      .from('user_permission')
      .insert([
        {
          user_id: ownerUser1.id,
          branch_id: branch1Id,
          action: 'manage_inventory',
        },
        {
          user_id: ownerUser1.id,
          branch_id: branch1Id,
          action: 'view_reports',
        },
        {
          user_id: cashierUser1.id,
          branch_id: branch2Id,
          action: 'process_orders',
        },
        {
          user_id: cashierUser1.id,
          branch_id: branch2Id,
          action: 'manage_beneficiaries',
        },
      ])
      .select();

    if (permissionError) throw permissionError;
    console.log(`✓ Created ${permissions.length} user permissions\n`);

    // 7. Seed Categories
    console.log('Seeding Categories...');
    const { data: categories, error: categoryError } = await supabase
      .from('category')
      .insert([
        {
          name: 'Electronics',
          description: 'Electronic devices and gadgets',
          active: true,
        },
        {
          name: 'Home & Kitchen',
          description: 'Home appliances and kitchen items',
          active: true,
        },
        {
          name: 'Gift Cards',
          description: 'Various gift cards and vouchers',
          active: true,
        },
        {
          name: 'Sports & Outdoors',
          description: 'Sports equipment and outdoor gear',
          active: false,
        },
      ])
      .select();

    if (categoryError) throw categoryError;
    console.log(`✓ Created ${categories.length} categories\n`);

    const cat1Id = categories[0].id;
    const cat2Id = categories[1].id;
    const cat3Id = categories[2].id;

    // 8. Seed Subcategories
    console.log('Seeding Subcategories...');
    const { data: subcategories, error: subcategoryError } = await supabase
      .from('subcategory')
      .insert([
        {
          category_id: cat1Id,
          name: 'Smartphones',
          description: 'Mobile phones and accessories',
          active: true,
        },
        {
          category_id: cat1Id,
          name: 'Tablets',
          description: 'Tablets and e-readers',
          active: true,
        },
        {
          category_id: cat2Id,
          name: 'Coffee Makers',
          description: 'Coffee machines and espresso makers',
          active: true,
        },
        {
          category_id: cat2Id,
          name: 'Cookware',
          description: 'Pots, pans, and cooking utensils',
          active: true,
        },
        {
          category_id: cat3Id,
          name: 'Retail Gift Cards',
          description: 'Gift cards for retail stores',
          active: true,
        },
        {
          category_id: cat3Id,
          name: 'Restaurant Vouchers',
          description: 'Dining and restaurant vouchers',
          active: true,
        },
      ])
      .select();

    if (subcategoryError) throw subcategoryError;
    console.log(`✓ Created ${subcategories.length} subcategories\n`);

    const subcat1Id = subcategories[0].id;
    const subcat2Id = subcategories[1].id;
    const subcat3Id = subcategories[2].id;
    const subcat4Id = subcategories[3].id;
    const subcat5Id = subcategories[4].id;

    // 9. Seed Products
    console.log('Seeding Products...');
    const { data: products, error: productError } = await supabase
      .from('product')
      .insert([
        {
          subcategory_id: subcat1Id,
          name: 'iPhone 15 Pro',
          description: 'Latest Apple smartphone with A17 chip',
          required_points: 5000,
          active: true,
        },
        {
          subcategory_id: subcat1Id,
          name: 'Samsung Galaxy S24',
          description: 'Premium Android smartphone',
          required_points: 4500,
          active: true,
        },
        {
          subcategory_id: subcat2Id,
          name: 'iPad Air',
          description: 'Apple tablet with M1 chip',
          required_points: 3000,
          active: true,
        },
        {
          subcategory_id: subcat3Id,
          name: 'Nespresso Machine',
          description: 'Premium coffee maker',
          required_points: 1500,
          active: true,
        },
        {
          subcategory_id: subcat4Id,
          name: 'Le Creuset Dutch Oven',
          description: 'Cast iron cookware set',
          required_points: 800,
          active: true,
        },
        {
          subcategory_id: subcat5Id,
          name: 'Amazon Gift Card $50',
          description: '$50 Amazon gift card',
          required_points: 500,
          active: true,
        },
        {
          subcategory_id: subcat5Id,
          name: 'Target Gift Card $25',
          description: '$25 Target gift card',
          required_points: 250,
          active: true,
        },
        {
          subcategory_id: subcat5Id,
          name: 'Best Buy Gift Card $100',
          description: '$100 Best Buy gift card',
          required_points: 1000,
          active: false,
        },
      ])
      .select();

    if (productError) throw productError;
    console.log(`✓ Created ${products.length} products\n`);

    const product1Id = products[0].id;
    const product2Id = products[1].id;
    const product3Id = products[2].id;
    const product4Id = products[3].id;
    const product5Id = products[4].id;

    // 10. Seed Stock
    console.log('Seeding Stock...');
    const { data: stock, error: stockError } = await supabase
      .from('stock')
      .insert([
        {
          branch_id: branch1Id,
          product_id: product1Id,
          quantity: 10,
          minimum_quantity: 5,
        },
        {
          branch_id: branch1Id,
          product_id: product2Id,
          quantity: 15,
          minimum_quantity: 5,
        },
        {
          branch_id: branch1Id,
          product_id: product3Id,
          quantity: 20,
          minimum_quantity: 10,
        },
        {
          branch_id: branch2Id,
          product_id: product4Id,
          quantity: 25,
          minimum_quantity: 10,
        },
        {
          branch_id: branch2Id,
          product_id: product5Id,
          quantity: 12,
          minimum_quantity: 5,
        },
        {
          branch_id: branch3Id,
          product_id: product1Id,
          quantity: 8,
          minimum_quantity: 5,
        },
        {
          branch_id: branch3Id,
          product_id: product3Id,
          quantity: 30,
          minimum_quantity: 15,
        },
      ])
      .select();

    if (stockError) throw stockError;
    console.log(`✓ Created ${stock.length} stock entries\n`);

    // 11. Seed Assignments
    console.log('Seeding Assignments...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignment')
      .insert([
        {
          branch_id: branch1Id,
          beneficiary_id: beneficiary1Id,
          user_id: cashierUser1.id,
          points: 1000,
          reason: 'Monthly reward',
          observations: 'First month bonus',
        },
        {
          branch_id: branch1Id,
          beneficiary_id: beneficiary2Id,
          user_id: cashierUser1.id,
          points: 2500,
          reason: 'Performance bonus',
          observations: 'Exceeded sales targets',
        },
        {
          branch_id: branch2Id,
          beneficiary_id: beneficiary3Id,
          user_id: ownerUser2.id,
          points: 500,
          reason: 'Welcome bonus',
          observations: 'New member welcome',
        },
        {
          branch_id: branch3Id,
          beneficiary_id: beneficiary1Id,
          user_id: collaboratorUser1.id,
          points: 750,
          reason: 'Referral bonus',
          observations: 'Referred 3 new members',
        },
      ])
      .select();

    if (assignmentError) throw assignmentError;
    console.log(`✓ Created ${assignments.length} assignments\n`);

    // 12. Seed Statuses
    console.log('Seeding Statuses...');
    const { data: statuses, error: statusError } = await supabase
      .from('status')
      .insert([
        {
          name: 'Pending',
          description: 'Order has been placed',
          is_terminal: false,
          order_num: 1,
        },
        {
          name: 'Processing',
          description: 'Order is being prepared',
          is_terminal: false,
          order_num: 2,
        },
        {
          name: 'Ready for Pickup',
          description: 'Order is ready for pickup',
          is_terminal: false,
          order_num: 3,
        },
        {
          name: 'Completed',
          description: 'Order has been delivered',
          is_terminal: true,
          order_num: 4,
        },
        {
          name: 'Cancelled',
          description: 'Order was cancelled',
          is_terminal: true,
          order_num: 5,
        },
      ])
      .select();

    if (statusError) throw statusError;
    console.log(`✓ Created ${statuses.length} statuses\n`);

    const status1Id = statuses[0].id;
    const status2Id = statuses[1].id;
    const status3Id = statuses[2].id;
    const status4Id = statuses[3].id;

    // 13. Seed App Orders
    console.log('Seeding App Orders...');
    const { data: orders, error: orderError } = await supabase
      .from('app_order')
      .insert([
        {
          order_number: 'ORD-2024-001',
          total_points: 500,
          observations: 'Standard order',
        },
        {
          order_number: 'ORD-2024-002',
          total_points: 1500,
          observations: 'Multiple items',
        },
        {
          order_number: 'ORD-2024-003',
          total_points: 250,
          observations: 'Gift card redemption',
        },
        {
          order_number: 'ORD-2024-004',
          total_points: 3000,
          observations: 'High value order',
        },
      ])
      .select();

    if (orderError) throw orderError;
    console.log(`✓ Created ${orders.length} orders\n`);

    const order1Id = orders[0].id;
    const order2Id = orders[1].id;
    const order3Id = orders[2].id;
    const order4Id = orders[3].id;

    // 14. Seed Redemptions
    console.log('Seeding Redemptions...');
    const { data: redemptions, error: redemptionError } = await supabase
      .from('redemption')
      .insert([
        {
          beneficiary_id: beneficiary1Id,
          product_id: product5Id,
          order_id: order1Id,
          points_used: 500,
          quantity: 1,
        },
        {
          beneficiary_id: beneficiary2Id,
          product_id: product4Id,
          order_id: order2Id,
          points_used: 1500,
          quantity: 1,
        },
        {
          beneficiary_id: beneficiary3Id,
          product_id: product5Id,
          order_id: order3Id,
          points_used: 250,
          quantity: 1,
        },
        {
          beneficiary_id: beneficiary2Id,
          product_id: product3Id,
          order_id: order4Id,
          points_used: 3000,
          quantity: 1,
        },
      ])
      .select();

    if (redemptionError) throw redemptionError;
    console.log(`✓ Created ${redemptions.length} redemptions\n`);

    // 15. Seed History
    console.log('Seeding History...');
    const { data: history, error: historyError } = await supabase
      .from('history')
      .insert([
        {
          order_id: order1Id,
          status_id: status1Id,
          observations: 'Order created',
        },
        {
          order_id: order1Id,
          status_id: status2Id,
          observations: 'Order processing started',
        },
        {
          order_id: order1Id,
          status_id: status4Id,
          observations: 'Order completed',
        },
        {
          order_id: order2Id,
          status_id: status1Id,
          observations: 'Order created',
        },
        {
          order_id: order2Id,
          status_id: status2Id,
          observations: 'Order processing',
        },
        {
          order_id: order2Id,
          status_id: status3Id,
          observations: 'Ready for pickup',
        },
        {
          order_id: order3Id,
          status_id: status1Id,
          observations: 'Order created',
        },
        {
          order_id: order3Id,
          status_id: status4Id,
          observations: 'Digital gift card delivered',
        },
        {
          order_id: order4Id,
          status_id: status1Id,
          observations: 'High value order created',
        },
      ])
      .select();

    if (historyError) throw historyError;
    console.log(`✓ Created ${history.length} history entries\n`);

    console.log('✅ Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Organizations: ${organizations.length}`);
    console.log(`- Addresses: ${addresses.length}`);
    console.log(`- Branches: ${branches.length}`);
    console.log(`- App Users: ${appUsers.length}`);
    console.log(`- Beneficiaries: ${beneficiaries.length}`);
    console.log(`- User Permissions: ${permissions.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Subcategories: ${subcategories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Stock: ${stock.length}`);
    console.log(`- Assignments: ${assignments.length}`);
    console.log(`- Statuses: ${statuses.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Redemptions: ${redemptions.length}`);
    console.log(`- History: ${history.length}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
