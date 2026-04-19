db = db.getSiblingDB('fsm_read');

db.createCollection('task01_bootstrap_marker');
db.task01_bootstrap_marker.updateOne(
  { name: 'backend-bootstrap' },
  { $set: { name: 'backend-bootstrap', initializedAt: new Date() } },
  { upsert: true }
);

// supplier_search_view 인덱스 (idempotent — createIndex 는 같은 이름이면 no-op)
db.createCollection('supplier_search_view');
db.supplier_search_view.createIndex({ categories: 1 }, { name: 'idx_categories' });
db.supplier_search_view.createIndex({ region: 1 }, { name: 'idx_region' });
db.supplier_search_view.createIndex({ oemAvailable: 1 }, { name: 'idx_oemAvailable' });
db.supplier_search_view.createIndex({ odmAvailable: 1 }, { name: 'idx_odmAvailable' });
db.supplier_search_view.createIndex({ updatedAt: -1 }, { name: 'idx_updatedAt_desc' });
db.supplier_search_view.createIndex({ companyName: 1 }, { name: 'idx_companyName' });
db.supplier_search_view.createIndex(
  { categories: 1, region: 1 },
  { name: 'idx_category_region' }
);
// companyName 키워드 검색은 정규식 기반. 텍스트 인덱스는 도입 시 재평가.

// supplier_detail_view: 단일 lookup 이므로 _id 외 추가 인덱스 불필요
db.createCollection('supplier_detail_view');
