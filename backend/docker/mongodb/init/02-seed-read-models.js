db = db.getSiblingDB('fsm_read');

db.supplier_search_view.deleteMany({});
db.supplier_detail_view.deleteMany({});
db.requester_request_summary_view.deleteMany({});

db.supplier_search_view.updateOne(
  { _id: 'supplier-seed-1' },
  {
    $set: {
      profileId: 'supplier-seed-1',
      companyName: 'Seed Supplier Foods',
      region: 'SEOUL',
      categories: ['SNACK'],
      monthlyCapacity: 10000,
      moq: 1000,
      oemAvailable: true,
      odmAvailable: false,
      verificationState: 'approved',
      exposureState: 'visible',
      updatedAt: new Date(),
    },
  },
  { upsert: true }
);

db.supplier_detail_view.updateOne(
  { _id: 'supplier-seed-1' },
  {
    $set: {
      profileId: 'supplier-seed-1',
      companyName: 'Seed Supplier Foods',
      representativeName: 'Seed Representative',
      region: 'SEOUL',
      categories: ['SNACK'],
      equipmentSummary: '자동 포장기 2대',
      monthlyCapacity: 10000,
      moq: 1000,
      oemAvailable: true,
      odmAvailable: false,
      rawMaterialSupport: true,
      packagingLabelingSupport: true,
      introduction: 'Seed approved supplier',
      verificationState: 'approved',
      exposureState: 'visible',
      logoUrl: null,
      certifications: [
        {
          type: 'HACCP',
          number: '12345',
          valid: true,
        },
      ],
      portfolioImages: [],
      updatedAt: new Date(),
    },
  },
  { upsert: true }
);

db.requester_request_summary_view.updateOne(
  { _id: 'request-seed-1' },
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
