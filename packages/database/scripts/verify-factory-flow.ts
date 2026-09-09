import { 
  RBACService, 
  BrandService, 
  StudioService, 
  OrderService 
} from '../../api/src/index';

console.log('====================================================');
console.log('Dissafyt Platform: Studio & Kasi Kollekt Factory OS Verification');
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
  // Test 1: RBAC for Creator & Factory Operator Personas
  // ----------------------------------------------------
  console.log('--- 1. Testing RBAC for Creator & Factory Personas ---');

  // Creator permissions
  assert(RBACService.hasPermission('creator', 'brand:manage_own'), 'Creator can manage own brand');
  assert(RBACService.hasPermission('creator', 'design:upload'), 'Creator can upload artwork designs');
  assert(RBACService.hasPermission('creator', 'product:create_custom'), 'Creator can create custom drops');
  assert(RBACService.hasPermission('creator', 'product:edit_own'), 'Creator can edit own drops');
  assert(RBACService.hasPermission('creator', 'job:view_own'), 'Creator can view own production tickets');
  assert(RBACService.hasPermission('creator', 'earnings:view_own'), 'Creator can view royalty earnings');
  
  // Creators should NOT be able to modify global inventory or change other brands
  assert(!RBACService.hasPermission('creator', 'product:delete'), 'Creator CANNOT delete global products');
  assert(!RBACService.hasPermission('creator', 'factory:update_job'), 'Creator CANNOT manually advance factory press status');
  assert(!RBACService.hasPermission('creator', 'audit:view'), 'Creator CANNOT view system audit logs');

  // Admin & Staff factory permissions
  assert(RBACService.hasPermission('admin', 'factory:view_queue'), 'Admin can view factory queue');
  assert(RBACService.hasPermission('admin', 'factory:update_job'), 'Admin can update heat press and QC status');
  assert(RBACService.hasPermission('admin', 'factory:dispatch'), 'Admin can generate waybills and dispatch parcels');
  assert(RBACService.hasPermission('staff', 'factory:view_queue'), 'Staff can view factory queue');
  assert(RBACService.hasPermission('staff', 'factory:update_job'), 'Staff can update heat press status');

  // ----------------------------------------------------
  // Test 2: Brand Registration & Deal Types
  // ----------------------------------------------------
  console.log('\n--- 2. Brand Registration & Commercial Deal Structuring ---');

  // Register Deal A: Stacked Returns (Wholesale / bulk inventory batch)
  const stackedBrandRes = await BrandService.createBrand({
    name: 'Skhanda Heritage Co.',
    slug: 'skhanda-heritage',
    bio: 'Pioneering township vintage aesthetics rooted in Kwaito and Soweto street culture.',
    deal_type: 'stacked_returns',
    commission_rate: 0.20,
    contact_email: 'skhanda@dissafyt.com',
  });

  assert(stackedBrandRes.success && !!stackedBrandRes.brand, 'Successfully registered "Stacked Returns" brand');
  assert(stackedBrandRes.brand?.deal_type === 'stacked_returns', 'Brand correctly marked with deal_type: stacked_returns');

  // Register Deal B: Drip Income (Zero-risk print-on-demand)
  const dripBrandRes = await BrandService.createBrand({
    name: 'Vibe Cult Johannesburg',
    slug: 'vibe-cult-jhb',
    bio: 'Modern urban typography and minimal geometric streetwear.',
    deal_type: 'drip_income',
    commission_rate: 0.35,
    contact_email: 'vibecult@dissafyt.com',
  });

  assert(dripBrandRes.success && !!dripBrandRes.brand, 'Successfully registered "Drip Income" brand');
  assert(dripBrandRes.brand?.deal_type === 'drip_income', 'Brand correctly marked with deal_type: drip_income');

  // ----------------------------------------------------
  // Test 3: Royalty & Margin Calculations
  // ----------------------------------------------------
  console.log('\n--- 3. Financial Margin & Royalty Calculations ---');

  const dripRoyalty = BrandService.calculateRoyalty(dripBrandRes.brand!, 450);
  assert(dripRoyalty.creatorRoyalty === 157.5, `Drip Income royalty correctly calculated (R450 * 35% = R157.50, got R${dripRoyalty.creatorRoyalty})`);
  assert(dripRoyalty.platformFee === 292.5, `Platform fee correctly calculated (R292.50, got R${dripRoyalty.platformFee})`);

  const stackedRoyalty = BrandService.calculateRoyalty(stackedBrandRes.brand!, 800);
  assert(stackedRoyalty.creatorRoyalty === 160.0, `Stacked Returns royalty correctly calculated (R800 * 20% = R160.00, got R${stackedRoyalty.creatorRoyalty})`);

  // ----------------------------------------------------
  // Test 4: Custom Garment Product Publishing
  // ----------------------------------------------------
  console.log('\n--- 4. Publishing Custom Streetwear Drops ---');

  const customTeeRes = await BrandService.createCustomProduct({
    name: 'Skhanda Boxy Graphic Tee',
    description: 'Heavyweight 240gsm combed cotton tee with oversized back print.',
    price: 480,
    brand_id: stackedBrandRes.brand?.id,
    design_file_url: 'https://dissafyt.storage/designs/skhanda-back-print.png',
    mockup_url: 'https://dissafyt.storage/mockups/skhanda-tee-mockup.png',
    print_placement: 'oversized_back',
    category: 'clothing',
    tags: ['streetwear', 'kasi_kollekt', 'tee'],
  });

  assert(customTeeRes.success && !!customTeeRes.product, 'Custom drop created successfully');
  assert(customTeeRes.product?.is_custom_print === true, 'Product flagged with is_custom_print: true');
  assert(customTeeRes.product?.print_placement === 'oversized_back', 'Print placement recorded as oversized_back');
  assert(customTeeRes.product?.brand_id === stackedBrandRes.brand?.id, 'Product linked to brand ID');

  // ----------------------------------------------------
  // Test 5: Customer Order Placement & Automatic Factory Ticket Generation
  // ----------------------------------------------------
  console.log('\n--- 5. Automated Order Mirroring to Micro-Factory Queue ---');

  // Place order with custom product
  const orderRes = await OrderService.createOrder({
    customer_id: 'cust-jhb-001',
    customer_email: 'buyer@kasi.co.za',
    customer_phone: '+27821234567',
    items: [
      {
        product_id: customTeeRes.product!.id,
        variant_id: 'var-l-black',
        quantity: 1,
        unit_price: 480,
      }
    ],
    shipping_address: {
      line1: '42 Vilakazi Street',
      city: 'Soweto',
      state: 'Gauteng',
      postal_code: '1804',
      country: 'ZA',
    },
    shipping_method: 'standard',
    shipping_cost: 100,
    payment_method: 'payfast',
  });

  assert(orderRes.success && !!orderRes.order, 'Customer placed order with custom streetwear item');

  // Verify factory print job was generated
  const activeJobs = await StudioService.listPrintJobs({ orderId: orderRes.order?.id });
  assert(activeJobs.length > 0, 'Factory queue received mirrored job ticket from order');
  
  const ticket = activeJobs[0];
  assert(ticket.status === 'pending', 'Job initial status is "pending"');
  assert(ticket.ticket_number.startsWith('PJ-2026-'), `Ticket has standardized identifier (${ticket.ticket_number})`);
  assert(ticket.product_name === customTeeRes.product?.name, 'Job accurately mirrors product name');
  assert(ticket.print_placement === 'oversized_back', 'Job preserves print placement instructions');

  // ----------------------------------------------------
  // Test 6: Micro-Factory Production Stage Lifecycle
  // ----------------------------------------------------
  console.log('\n--- 6. Factory Shopfloor Stage Progression ---');

  // Stage A: Start DTF Heat Press
  const startPressRes = await StudioService.updateJobStatus(ticket.id, 'printing', undefined, {
    email: 'operator@dissafyt.com',
    role: 'staff',
  });
  assert(startPressRes.success && startPressRes.printJob?.status === 'printing', 'Job transitioned to "printing" (160°C DTF press active)');

  // Stage B: Pass Quality Control
  const qcRes = await StudioService.updateJobStatus(ticket.id, 'qc_passed', undefined, {
    email: 'inspector@dissafyt.com',
    role: 'manager',
  });
  assert(qcRes.success && qcRes.printJob?.status === 'qc_passed', 'Job passed Quality Control ("qc_passed")');

  // Stage C: Garment Folded & Tagged
  const packRes = await StudioService.updateJobStatus(ticket.id, 'ready_to_pack', undefined, {
    email: 'pack@dissafyt.com',
    role: 'staff',
  });
  assert(packRes.success && packRes.printJob?.status === 'ready_to_pack', 'Job marked "ready_to_pack"');

  // Stage D: Courier Guy Dispatch & Waybill Assignment
  const courierWaybill = 'CG-DISS-2026-889922';
  const dispatchRes = await StudioService.updateJobStatus(ticket.id, 'dispatched', courierWaybill, {
    email: 'dispatch@dissafyt.com',
    role: 'manager',
  });
  assert(dispatchRes.success && dispatchRes.printJob?.status === 'dispatched', 'Job marked "dispatched"');
  assert(dispatchRes.printJob?.courier_tracking_number === courierWaybill, 'Courier Guy tracking waybill recorded on job ticket');

  // ----------------------------------------------------
  // Test 7: Direct Print Job Creation & Ticket Retrieval
  // ----------------------------------------------------
  console.log('\n--- 7. Manual Job Ticket Creation & Audit Log ---');

  const manualJobRes = await StudioService.createPrintJob({
    order_id: 'ORD-MANUAL-7711',
    product_id: 'prod-hoodie-002',
    product_name: 'Vibe Cult Johannesburg Hoodie',
    brand_id: dripBrandRes.brand?.id,
    brand_name: dripBrandRes.brand?.name,
    garment_color: 'Onyx Black',
    garment_size: 'XL',
    quantity: 2,
    print_placement: 'chest_pocket',
    design_file_url: 'https://dissafyt.storage/designs/vibe-cult-logo.png',
    artwork_notes: 'White DTF ink with gold metallic shimmer pigment.',
  });

  assert(manualJobRes.success && !!manualJobRes.printJob, 'Direct print job ticket created successfully');
  
  const retrievedTicket = await StudioService.getJobTicket(manualJobRes.printJob!.id);
  assert(retrievedTicket !== null, 'Retrieved job ticket by ID');
  assert(retrievedTicket?.artwork_notes === 'White DTF ink with gold metallic shimmer pigment.', 'Artwork notes preserved on ticket');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Verification Complete: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Unhandled error during verification:', err);
  process.exit(1);
});
