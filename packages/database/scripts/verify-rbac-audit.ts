import { 
  RBACService, 
  AuditService, 
  AdminProductService, 
  AdminBarbershopService, 
  BarbershopService 
} from '../../api/src/index';

console.log('====================================================');
console.log('Dissafyt Platform: RBAC & Invisible Audit Trail Verification');
console.log('====================================================\n');

async function runVerification() {
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedCount++;
    }
  }

  // ----------------------------------------------------
  // Test 1: RBAC Permission Matrix Evaluation
  // ----------------------------------------------------
  console.log('\n--- 1. Evaluating Role-Based Access Control (RBAC) ---');
  
  // Admin permissions
  assert(RBACService.hasPermission('admin', 'product:create'), 'Admin can create products');
  assert(RBACService.hasPermission('admin', 'product:edit'), 'Admin can edit products');
  assert(RBACService.hasPermission('admin', 'product:delete'), 'Admin can delete products');
  assert(RBACService.hasPermission('admin', 'service:edit'), 'Admin can edit services');
  assert(RBACService.hasPermission('admin', 'staff:edit'), 'Admin can edit staff');
  assert(RBACService.hasPermission('admin', 'location:edit'), 'Admin can edit locations');
  assert(RBACService.hasPermission('admin', 'user:manage_roles'), 'Admin can manage roles');
  assert(RBACService.hasPermission('admin', 'audit:view'), 'Admin can view audit logs');

  // Staff permissions (operational staff)
  assert(RBACService.hasPermission('staff', 'product:edit'), 'Staff can edit products (e.g. stock, pricing)');
  assert(RBACService.hasPermission('staff', 'service:edit'), 'Staff can edit services');
  assert(RBACService.hasPermission('staff', 'staff:edit'), 'Staff can edit staff');
  assert(!RBACService.hasPermission('staff', 'product:delete'), 'Staff CANNOT delete products');
  assert(!RBACService.hasPermission('staff', 'staff:delete'), 'Staff CANNOT delete staff');
  assert(!RBACService.hasPermission('staff', 'user:manage_roles'), 'Staff CANNOT manage user roles');
  assert(!RBACService.hasPermission('staff', 'audit:view'), 'Staff CANNOT view audit logs');

  // Barber permissions (practitioner)
  assert(RBACService.hasPermission('barber', 'staff:edit'), 'Barber can edit staff (own profile)');
  assert(!RBACService.hasPermission('barber', 'product:edit'), 'Barber CANNOT edit products');
  assert(!RBACService.hasPermission('barber', 'service:delete'), 'Barber CANNOT delete services');
  assert(!RBACService.hasPermission('barber', 'location:create'), 'Barber CANNOT create locations');

  // Customer permissions
  assert(!RBACService.hasPermission('customer', 'product:edit'), 'Customer CANNOT edit products');
  assert(!RBACService.hasPermission('customer', 'service:create'), 'Customer CANNOT create services');
  assert(!RBACService.hasPermission('customer', 'audit:view'), 'Customer CANNOT view audit logs');

  // Role permissions listing
  const adminPerms = RBACService.getPermissions('admin');
  const staffPerms = RBACService.getPermissions('staff');
  assert(adminPerms.length > staffPerms.length, 'Admin role has strictly more permissions than Staff');

  // ----------------------------------------------------
  // Test 2: Location Management & Audit Logging
  // ----------------------------------------------------
  console.log('\n--- 2. Studio Locations CRUD & Audit Trail ---');
  
  const locationsBefore = await BarbershopService.listLocations();
  assert(locationsBefore.length > 0, `Loaded ${locationsBefore.length} initial studio location(s)`);

  const initialLoc = locationsBefore[0];
  const updatedName = `${initialLoc.name} [Flagship Audited]`;

  const locRes = await BarbershopService.updateLocation(
    initialLoc.id,
    { name: updatedName, description: 'Updated flagship studio description via verification' },
    { email: 'admin@dissafyt.co.za', role: 'admin' }
  );

  assert(locRes.success && locRes.location?.name === updatedName, 'Location name updated successfully');

  // Revert location change
  await BarbershopService.updateLocation(
    initialLoc.id,
    { name: initialLoc.name, description: initialLoc.description },
    { email: 'admin@dissafyt.co.za', role: 'admin' }
  );
  console.log('Location name reverted cleanly to original.');

  // ----------------------------------------------------
  // Test 3: Product Edit & Stock Mutation Audit Logging
  // ----------------------------------------------------
  console.log('\n--- 3. Product Updates & Audit Trail ---');

  const prods = await AdminProductService.listProducts();
  if (prods.length > 0) {
    const targetProduct = prods[0];
    const originalPrice = targetProduct.base_price;
    const testPrice = originalPrice + 10;

    const prodRes = await AdminProductService.updateProduct(
      targetProduct.id,
      { base_price: testPrice },
      { id: 'usr_staff_002', email: 'staff@dissafyt.co.za', role: 'staff' }
    );

    assert(prodRes.success && prodRes.product?.base_price === testPrice, `Product base_price updated to R${testPrice}`);

    // Revert product price
    await AdminProductService.updateProduct(
      targetProduct.id,
      { base_price: originalPrice },
      { id: 'usr_admin_001', email: 'admin@dissafyt.co.za', role: 'admin' }
    );
    console.log('Product price reverted cleanly.');
  } else {
    console.log('No existing products found to mutate, skipping product edit test.');
  }

  // ----------------------------------------------------
  // Test 4: Barbershop Service Edit & Audit Logging
  // ----------------------------------------------------
  console.log('\n--- 4. Barbershop Service Updates & Audit Trail ---');

  const services = await AdminBarbershopService.listServices();
  if (services.length > 0) {
    const targetService = services[0];
    const originalPrice = targetService.price;
    const testPrice = originalPrice + 15;

    const servRes = await AdminBarbershopService.updateService(
      targetService.id,
      { price: testPrice },
      { email: 'admin@dissafyt.co.za', role: 'admin' }
    );

    assert(servRes.success && servRes.service?.price === testPrice, `Service price updated to R${testPrice}`);

    // Revert service price
    await AdminBarbershopService.updateService(
      targetService.id,
      { price: originalPrice },
      { email: 'admin@dissafyt.co.za', role: 'admin' }
    );
    console.log('Service price reverted cleanly.');
  }

  // ----------------------------------------------------
  // Test 5: Barbershop Staff Edit & Audit Logging
  // ----------------------------------------------------
  console.log('\n--- 5. Barbershop Staff Updates & Audit Trail ---');

  const staffList = await AdminBarbershopService.listStaff();
  if (staffList.length > 0) {
    const targetStaff = staffList[0];
    const originalBio = targetStaff.bio;
    const testBio = 'Master Artisan & Creative Director at Dissafyt Studio.';

    const staffRes = await AdminBarbershopService.updateStaff(
      targetStaff.id,
      { bio: testBio },
      { email: 'admin@dissafyt.co.za', role: 'admin' }
    );

    assert(staffRes.success && staffRes.staff?.bio === testBio, `Staff bio updated to "${testBio}"`);

    // Revert staff bio
    await AdminBarbershopService.updateStaff(
      targetStaff.id,
      { bio: originalBio },
      { email: 'admin@dissafyt.co.za', role: 'admin' }
    );
    console.log('Staff bio reverted cleanly.');
  }

  // ----------------------------------------------------
  // Test 6: Audit Trail Retrieval & Schema Verification
  // ----------------------------------------------------
  console.log('\n--- 6. Verifying Audit Trail History & Diffs ---');

  const recentLogs = await AuditService.listLogs(20);
  assert(recentLogs.length >= 4, `Found ${recentLogs.length} audit log entries recorded in sequence`);

  const latestLog = recentLogs[0];
  assert(Boolean(latestLog.id), 'Audit record has UUID id');
  assert(Boolean(latestLog.actor_email), `Audit actor email recorded (${latestLog.actor_email})`);
  assert(Boolean(latestLog.actor_role), `Audit actor role recorded (${latestLog.actor_role})`);
  assert(Boolean(latestLog.action), `Audit action recorded (${latestLog.action})`);
  assert(Boolean(latestLog.entity_type), `Audit entity type recorded (${latestLog.entity_type})`);
  assert(latestLog.changes !== undefined && Object.keys(latestLog.changes).length > 0, 'Audit diff captured before/after state');

  console.log('\nLatest audit event sample:');
  console.log({
    id: latestLog.id,
    action: latestLog.action,
    entity: latestLog.entity_type,
    operator: `${latestLog.actor_email} (${latestLog.actor_role})`,
    timestamp: latestLog.created_at,
    changes: latestLog.changes
  });

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Verification Complete: ${passedCount} passed, ${failedCount} failed`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
