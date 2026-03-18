db = db.getSiblingDB('fsm_read');

db.supplier_search_view.updateOne(
  { supplierId: 'supplier-seed-1' },
  {
    $set: {
      supplierId: 'supplier-seed-1',
      companyName: 'Seed Supplier Foods',
      region: 'SEOUL',
      categories: ['SNACK'],
      verificationState: 'approved',
      capacitySummary: 'monthly: 10000 units',
      moq: 1000,
      oem: true,
      odm: false,
      updatedAt: new Date(),
    },
  },
  { upsert: true }
);

db.requester_request_summary_view.updateOne(
  { requestId: 'request-seed-1' },
  {
    $set: {
      requestId: 'request-seed-1',
      title: 'Seed Public Request',
      mode: 'public',
      state: 'open',
      requesterId: 'requester-seed-1',
      updatedAt: new Date(),
    },
  },
  { upsert: true }
);
