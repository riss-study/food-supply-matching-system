// ============================================================
// 잇다(food2008) MongoDB Read Model 시드 데이터
// MariaDB 02-mock-data.sql과 1:1 대응
// 모든 테스트 계정 비밀번호: Test1234!
// 실행: seed-mongodb.sh 또는 seed-all.sh
// ============================================================

db = db.getSiblingDB('fsm_read');

var now = new Date();
function daysAgo(d) { return new Date(now.getTime() - d * 24 * 60 * 60 * 1000); }

// 시드 데이터만 정리 (seed_ 프리픽스)
['supplier_search_view', 'supplier_detail_view',
 'admin_review_queue_view', 'admin_review_detail_view',
 'requester_request_summary_view', 'supplier_request_feed_view',
 'admin_notice_view', 'public_notice_view',
 'user_me_view', 'requester_business_profile_view'
].forEach(function(c) {
  db[c].deleteMany({ _id: /seed_/ });
  db[c].deleteMany({ _id: /^feed_seed_/ });
});

// ============================================================
// 1. user_me_view (15명)
// ============================================================
var users = [
  { _id: 'usr_seed_admin01',    userId: 'usr_seed_admin01',    email: 'admin@test.com',      role: 'ADMIN',     businessApprovalState: null,        createdAt: daysAgo(90) },
  { _id: 'usr_seed_admin02',    userId: 'usr_seed_admin02',    email: 'admin2@test.com',     role: 'ADMIN',     businessApprovalState: null,        createdAt: daysAgo(60) },
  { _id: 'usr_seed_buyer01',    userId: 'usr_seed_buyer01',    email: 'buyer@test.com',      role: 'REQUESTER', businessApprovalState: 'approved',  createdAt: daysAgo(80) },
  { _id: 'usr_seed_buyer02',    userId: 'usr_seed_buyer02',    email: 'buyer2@test.com',     role: 'REQUESTER', businessApprovalState: 'approved',  createdAt: daysAgo(70) },
  { _id: 'usr_seed_buyer03',    userId: 'usr_seed_buyer03',    email: 'buyer3@test.com',     role: 'REQUESTER', businessApprovalState: 'submitted', createdAt: daysAgo(50) },
  { _id: 'usr_seed_buyer04',    userId: 'usr_seed_buyer04',    email: 'buyer4@test.com',     role: 'REQUESTER', businessApprovalState: 'approved',  createdAt: daysAgo(40) },
  { _id: 'usr_seed_buyer05',    userId: 'usr_seed_buyer05',    email: 'buyer5@test.com',     role: 'REQUESTER', businessApprovalState: 'rejected',  createdAt: daysAgo(20) },
  { _id: 'usr_seed_supplier01', userId: 'usr_seed_supplier01', email: 'supplier@test.com',   role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(85) },
  { _id: 'usr_seed_supplier02', userId: 'usr_seed_supplier02', email: 'supplier2@test.com',  role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(75) },
  { _id: 'usr_seed_supplier03', userId: 'usr_seed_supplier03', email: 'supplier3@test.com',  role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(65) },
  { _id: 'usr_seed_supplier04', userId: 'usr_seed_supplier04', email: 'supplier4@test.com',  role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(55) },
  { _id: 'usr_seed_supplier05', userId: 'usr_seed_supplier05', email: 'supplier5@test.com',  role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(45) },
  { _id: 'usr_seed_supplier06', userId: 'usr_seed_supplier06', email: 'supplier6@test.com',  role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(35) },
  { _id: 'usr_seed_supplier07', userId: 'usr_seed_supplier07', email: 'supplier7@test.com',  role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(25) },
  { _id: 'usr_seed_supplier08', userId: 'usr_seed_supplier08', email: 'supplier8@test.com',  role: 'SUPPLIER',  businessApprovalState: null,        createdAt: daysAgo(15) }
];
users.forEach(function(u) { db.user_me_view.updateOne({ _id: u._id }, { $set: u }, { upsert: true }); });

// ============================================================
// 2. requester_business_profile_view (5명)
// ============================================================
var bprofiles = [
  { _id: 'bprof_seed_buyer01', profileId: 'bprof_seed_buyer01', userId: 'usr_seed_buyer01', businessName: '(주)푸드마트',         businessRegistrationNumber: '123-45-67890', contactName: '김바이어', contactPhone: '02-1234-5678', contactEmail: 'buyer@test.com',  verificationScope: 'domestic', approvalState: 'approved',  submittedAt: daysAgo(75), approvedAt: daysAgo(70), rejectedAt: null, rejectionReason: null, updatedAt: daysAgo(70) },
  { _id: 'bprof_seed_buyer02', profileId: 'bprof_seed_buyer02', userId: 'usr_seed_buyer02', businessName: '(주)그린마켓',         businessRegistrationNumber: '234-56-78901', contactName: '이그린',   contactPhone: '02-2345-6789', contactEmail: 'buyer2@test.com', verificationScope: 'domestic', approvalState: 'approved',  submittedAt: daysAgo(65), approvedAt: daysAgo(60), rejectedAt: null, rejectionReason: null, updatedAt: daysAgo(60) },
  { _id: 'bprof_seed_buyer03', profileId: 'bprof_seed_buyer03', userId: 'usr_seed_buyer03', businessName: '(주)헬스푸드코리아',   businessRegistrationNumber: '345-67-89012', contactName: '박건강',   contactPhone: '02-3456-7890', contactEmail: 'buyer3@test.com', verificationScope: 'domestic', approvalState: 'submitted', submittedAt: daysAgo(5),  approvedAt: null,        rejectedAt: null, rejectionReason: null, updatedAt: daysAgo(5) },
  { _id: 'bprof_seed_buyer04', profileId: 'bprof_seed_buyer04', userId: 'usr_seed_buyer04', businessName: '(주)편의점프레시',     businessRegistrationNumber: '456-78-90123', contactName: '최프레',   contactPhone: '02-4567-8901', contactEmail: 'buyer4@test.com', verificationScope: 'domestic', approvalState: 'approved',  submittedAt: daysAgo(35), approvedAt: daysAgo(30), rejectedAt: null, rejectionReason: null, updatedAt: daysAgo(30) },
  { _id: 'bprof_seed_buyer05', profileId: 'bprof_seed_buyer05', userId: 'usr_seed_buyer05', businessName: '(주)온라인몰다이렉트', businessRegistrationNumber: '567-89-01234', contactName: '정온라',   contactPhone: '02-5678-9012', contactEmail: 'buyer5@test.com', verificationScope: 'domestic', approvalState: 'rejected',  submittedAt: daysAgo(18), approvedAt: null,        rejectedAt: daysAgo(15), rejectionReason: '사업자등록증 확인 불가', updatedAt: daysAgo(15) }
];
bprofiles.forEach(function(b) { db.requester_business_profile_view.updateOne({ _id: b._id }, { $set: b }, { upsert: true }); });

// ============================================================
// 3. supplier_search_view (승인+노출 3개만)
// ============================================================
var searchItems = [
  { _id: 'sprof_seed_01', profileId: 'sprof_seed_01', companyName: '(주)한맛식품',     region: '경기 화성', categories: ['snack','frozen'], monthlyCapacity: 50000, moq: 1000, oemAvailable: true,  odmAvailable: true,  verificationState: 'approved', exposureState: 'listed', logoUrl: null, updatedAt: now },
  { _id: 'sprof_seed_02', profileId: 'sprof_seed_02', companyName: '대한음료(주)',     region: '충북 청주', categories: ['beverage'],       monthlyCapacity: 80000, moq: 2000, oemAvailable: true,  odmAvailable: false, verificationState: 'approved', exposureState: 'listed', logoUrl: null, updatedAt: now },
  { _id: 'sprof_seed_03', profileId: 'sprof_seed_03', companyName: '(주)서울베이커리', region: '서울 강남', categories: ['bakery','snack'], monthlyCapacity: 30000, moq: 500,  oemAvailable: true,  odmAvailable: true,  verificationState: 'approved', exposureState: 'listed', logoUrl: null, updatedAt: now }
];
searchItems.forEach(function(s) { db.supplier_search_view.updateOne({ _id: s._id }, { $set: s }, { upsert: true }); });

// ============================================================
// 4. supplier_detail_view (전체 8개)
// ============================================================
var details = [
  { _id: 'sprof_seed_01', profileId: 'sprof_seed_01', companyName: '(주)한맛식품',     representativeName: '김대한', region: '경기 화성', categories: ['snack','frozen'], equipmentSummary: '자동화 스낵라인 3개, 냉동포장 라인 2개', monthlyCapacity: 50000, moq: 1000, oemAvailable: true,  odmAvailable: true,  rawMaterialSupport: true,  packagingLabelingSupport: true,  introduction: 'HACCP·ISO 22000 인증 스낵/냉동식품 전문 OEM/ODM 제조사.', verificationState: 'approved',  exposureState: 'listed', logoUrl: null, certifications: [{type:'HACCP',number:'HACCP-2024-001',valid:true},{type:'ISO 22000',number:'ISO-2024-001',valid:true}], portfolioImages: [], updatedAt: now },
  { _id: 'sprof_seed_02', profileId: 'sprof_seed_02', companyName: '대한음료(주)',     representativeName: '이음료', region: '충북 청주', categories: ['beverage'],       equipmentSummary: 'PET 충전라인 2개, 캔 충전라인 1개',     monthlyCapacity: 80000, moq: 2000, oemAvailable: true,  odmAvailable: false, rawMaterialSupport: true,  packagingLabelingSupport: true,  introduction: '음료 전문 제조사. 대량 생산 체제.',                       verificationState: 'approved',  exposureState: 'listed', logoUrl: null, certifications: [{type:'HACCP',number:'HACCP-2024-002',valid:true},{type:'FSSC 22000',number:'FSSC-2024-001',valid:false}], portfolioImages: [], updatedAt: now },
  { _id: 'sprof_seed_03', profileId: 'sprof_seed_03', companyName: '(주)서울베이커리', representativeName: '박빵집', region: '서울 강남', categories: ['bakery','snack'], equipmentSummary: '오븐 10대, 발효실 3실',                 monthlyCapacity: 30000, moq: 500,  oemAvailable: true,  odmAvailable: true,  rawMaterialSupport: false, packagingLabelingSupport: true,  introduction: '프리미엄 베이커리·스낵 전문.',                              verificationState: 'approved',  exposureState: 'listed', logoUrl: null, certifications: [{type:'HACCP',number:'HACCP-2024-003',valid:true}], portfolioImages: [], updatedAt: now },
  { _id: 'sprof_seed_04', profileId: 'sprof_seed_04', companyName: '경남소스공업(주)', representativeName: '정소스', region: '경남 김해', categories: ['sauce'],           equipmentSummary: '소스 조합탱크 5기, 충전라인 3개',       monthlyCapacity: 20000, moq: 3000, oemAvailable: true,  odmAvailable: false, rawMaterialSupport: true,  packagingLabelingSupport: false, introduction: '소스류 전문 OEM. HACCP 인증.',                               verificationState: 'approved',  exposureState: 'hidden', logoUrl: null, certifications: [{type:'HACCP',number:'HACCP-2024-004',valid:true}], portfolioImages: [], updatedAt: now },
  { _id: 'sprof_seed_05', profileId: 'sprof_seed_05', companyName: '(주)제주유기농',   representativeName: '오유기', region: '제주',       categories: ['dairy','health'], equipmentSummary: '유기농 인증 가공시설',                   monthlyCapacity: 15000, moq: 200,  oemAvailable: false, odmAvailable: true,  rawMaterialSupport: false, packagingLabelingSupport: false, introduction: '제주 청정 원료 기반 유기농 건강식품 전문.',                   verificationState: 'submitted', exposureState: 'hidden', logoUrl: null, certifications: [{type:'ORGANIC',number:'ORG-2024-001',valid:false},{type:'HACCP',number:'HACCP-2024-005',valid:false}], portfolioImages: [], updatedAt: now },
  { _id: 'sprof_seed_06', profileId: 'sprof_seed_06', companyName: '부산수산식품(주)', representativeName: '최수산', region: '부산 사하', categories: ['frozen','other'], equipmentSummary: '급속냉동기 3대, IQF 라인',              monthlyCapacity: 40000, moq: 1500, oemAvailable: true,  odmAvailable: false, rawMaterialSupport: true,  packagingLabelingSupport: true,  introduction: '수산물 기반 냉동식품 전문.',                                 verificationState: 'draft',     exposureState: 'hidden', logoUrl: null, certifications: [], portfolioImages: [], updatedAt: now },
  { _id: 'sprof_seed_07', profileId: 'sprof_seed_07', companyName: '(주)전주명가',     representativeName: '한전주', region: '전북 전주', categories: ['sauce','snack'],   equipmentSummary: '전통 장류 숙성고 10동',                 monthlyCapacity: 25000, moq: 800,  oemAvailable: false, odmAvailable: true,  rawMaterialSupport: false, packagingLabelingSupport: false, introduction: '전통 장류 및 간식 전문 ODM.',                                verificationState: 'rejected',  exposureState: 'hidden', logoUrl: null, certifications: [{type:'HACCP',number:'HACCP-2023-EXP',valid:false}], portfolioImages: [], updatedAt: now },
  { _id: 'sprof_seed_08', profileId: 'sprof_seed_08', companyName: '인천냉동식품(주)', representativeName: '임냉동', region: '인천 남동', categories: ['frozen'],          equipmentSummary: '대형 냉동창고 2동, 만두라인 4개',       monthlyCapacity: 60000, moq: 5000, oemAvailable: true,  odmAvailable: true,  rawMaterialSupport: true,  packagingLabelingSupport: true,  introduction: '냉동만두·냉동밥류 대량생산 전문.',                           verificationState: 'hold',      exposureState: 'hidden', logoUrl: null, certifications: [{type:'HACCP',number:'HACCP-2024-006',valid:false}], portfolioImages: [], updatedAt: now }
];
details.forEach(function(d) { db.supplier_detail_view.updateOne({ _id: d._id }, { $set: d }, { upsert: true }); });

// ============================================================
// 5. admin_review_queue_view (제출+보류 2건)
// ============================================================
var reviewQueue = [
  { _id: 'vsub_seed_04', reviewId: 'vsub_seed_04', supplierProfileId: 'sprof_seed_05', companyName: '(주)제주유기농',   state: 'submitted', submittedAt: daysAgo(3), pendingDays: 3, verificationState: 'submitted' },
  { _id: 'vsub_seed_06', reviewId: 'vsub_seed_06', supplierProfileId: 'sprof_seed_08', companyName: '인천냉동식품(주)', state: 'hold',      submittedAt: daysAgo(7), pendingDays: 7, verificationState: 'hold' }
];
reviewQueue.forEach(function(r) { db.admin_review_queue_view.updateOne({ _id: r._id }, { $set: r }, { upsert: true }); });

// ============================================================
// 6. admin_review_detail_view (전체 6건)
// ============================================================
var reviewDetails = [
  { _id: 'vsub_seed_01', reviewId: 'vsub_seed_01', supplierProfileId: 'sprof_seed_01', companyName: '(주)한맛식품',     representativeName: '김대한', region: '경기 화성', categories: ['snack','frozen'], state: 'approved',  submittedAt: daysAgo(75), pendingDays: 0, reviewedAt: daysAgo(70), reviewedBy: 'usr_seed_admin01', reviewNoteInternal: 'HACCP/ISO 확인 완료', reviewNotePublic: '검수 완료.', files: [], history: [{actionType:'review_approve',actorId:'usr_seed_admin01',createdAt:daysAgo(70),note:'승인'}] },
  { _id: 'vsub_seed_02', reviewId: 'vsub_seed_02', supplierProfileId: 'sprof_seed_02', companyName: '대한음료(주)',     representativeName: '이음료', region: '충북 청주', categories: ['beverage'],       state: 'approved',  submittedAt: daysAgo(65), pendingDays: 0, reviewedAt: daysAgo(60), reviewedBy: 'usr_seed_admin01', reviewNoteInternal: '음료 설비 확인', reviewNotePublic: '검수 완료.', files: [], history: [{actionType:'review_approve',actorId:'usr_seed_admin01',createdAt:daysAgo(60),note:'승인'}] },
  { _id: 'vsub_seed_03', reviewId: 'vsub_seed_03', supplierProfileId: 'sprof_seed_03', companyName: '(주)서울베이커리', representativeName: '박빵집', region: '서울 강남', categories: ['bakery','snack'], state: 'approved',  submittedAt: daysAgo(55), pendingDays: 0, reviewedAt: daysAgo(50), reviewedBy: 'usr_seed_admin02', reviewNoteInternal: 'HACCP 확인', reviewNotePublic: '검수 완료.', files: [], history: [{actionType:'review_approve',actorId:'usr_seed_admin02',createdAt:daysAgo(50),note:'승인'}] },
  { _id: 'vsub_seed_04', reviewId: 'vsub_seed_04', supplierProfileId: 'sprof_seed_05', companyName: '(주)제주유기농',   representativeName: '오유기', region: '제주',       categories: ['dairy','health'], state: 'submitted', submittedAt: daysAgo(3),  pendingDays: 3, reviewedAt: null, reviewedBy: null, reviewNoteInternal: null, reviewNotePublic: null, files: [{fileId:'att_seed_cert07',fileName:'유기농인증서.pdf',status:'submitted',downloadUrl:null},{fileId:'att_seed_cert08',fileName:'HACCP인증서.pdf',status:'submitted',downloadUrl:null}], history: [{actionType:'review_submit',actorId:'usr_seed_supplier05',createdAt:daysAgo(3),note:'서류 제출'}] },
  { _id: 'vsub_seed_05', reviewId: 'vsub_seed_05', supplierProfileId: 'sprof_seed_07', companyName: '(주)전주명가',     representativeName: '한전주', region: '전북 전주', categories: ['sauce','snack'],   state: 'rejected',  submittedAt: daysAgo(15), pendingDays: 0, reviewedAt: daysAgo(12), reviewedBy: 'usr_seed_admin01', reviewNoteInternal: 'HACCP 유효기간 만료', reviewNotePublic: '인증서 유효기간 만료.', files: [{fileId:'att_seed_cert09',fileName:'HACCP인증서(만료).pdf',status:'submitted',downloadUrl:null}], history: [{actionType:'review_submit',actorId:'usr_seed_supplier07',createdAt:daysAgo(15),note:'서류 제출'},{actionType:'review_reject',actorId:'usr_seed_admin01',createdAt:daysAgo(12),note:'반려'}] },
  { _id: 'vsub_seed_06', reviewId: 'vsub_seed_06', supplierProfileId: 'sprof_seed_08', companyName: '인천냉동식품(주)', representativeName: '임냉동', region: '인천 남동', categories: ['frozen'],          state: 'hold',      submittedAt: daysAgo(7),  pendingDays: 7, reviewedAt: null, reviewedBy: null, reviewNoteInternal: '사업자등록증 해상도 불량', reviewNotePublic: null, files: [{fileId:'att_seed_cert10',fileName:'HACCP인증서.pdf',status:'submitted',downloadUrl:null}], history: [{actionType:'review_submit',actorId:'usr_seed_supplier08',createdAt:daysAgo(7),note:'서류 제출'}] }
];
reviewDetails.forEach(function(r) { db.admin_review_detail_view.updateOne({ _id: r._id }, { $set: r }, { upsert: true }); });

// ============================================================
// 7. requester_request_summary_view (8건)
// ============================================================
var requests = [
  { _id: 'req_seed_01', requestId: 'req_seed_01', title: '프로틴바 OEM 제조사 찾습니다',   category: 'snack',    state: 'open',      mode: 'public',   quoteCount: 2, createdAt: daysAgo(10) },
  { _id: 'req_seed_02', requestId: 'req_seed_02', title: '과일주스 소량 생산 가능한 업체',  category: 'beverage', state: 'open',      mode: 'public',   quoteCount: 1, createdAt: daysAgo(8) },
  { _id: 'req_seed_03', requestId: 'req_seed_03', title: '유기농 그래놀라 ODM 의뢰',        category: 'health',   state: 'open',      mode: 'public',   quoteCount: 1, createdAt: daysAgo(7) },
  { _id: 'req_seed_04', requestId: 'req_seed_04', title: '냉동만두 대량생산 파트너 모집',    category: 'frozen',   state: 'open',      mode: 'targeted', quoteCount: 0, createdAt: daysAgo(5) },
  { _id: 'req_seed_05', requestId: 'req_seed_05', title: 'PB 베이커리 제조 파트너',          category: 'bakery',   state: 'open',      mode: 'public',   quoteCount: 1, createdAt: daysAgo(3) },
  { _id: 'req_seed_06', requestId: 'req_seed_06', title: '간장소스류 OEM 제조 완료건',       category: 'sauce',    state: 'closed',    mode: 'public',   quoteCount: 1, createdAt: daysAgo(30) },
  { _id: 'req_seed_07', requestId: 'req_seed_07', title: '도시락 반찬류 냉동제품 (취소)',     category: 'frozen',   state: 'cancelled', mode: 'targeted', quoteCount: 0, createdAt: daysAgo(20) },
  { _id: 'req_seed_08', requestId: 'req_seed_08', title: '건강음료 시제품 개발 (작성중)',     category: 'beverage', state: 'draft',     mode: 'public',   quoteCount: 0, createdAt: daysAgo(1) }
];
requests.forEach(function(r) { db.requester_request_summary_view.updateOne({ _id: r._id }, { $set: r }, { upsert: true }); });

// ============================================================
// 8. supplier_request_feed_view (open 의뢰 5건)
// ============================================================
var feed = [
  { _id: 'feed_seed_01', feedItemId: 'feed_seed_01', requestId: 'req_seed_01', requesterBusinessName: '(주)푸드마트',     title: '프로틴바 OEM 제조사 찾습니다',  category: 'snack',    desiredVolume: '10,000개', targetPriceMin: 800,  targetPriceMax: 1200, certificationRequirement: ['HACCP'],           mode: 'public',   isTargeted: false, hasQuoted: false, createdAt: daysAgo(10) },
  { _id: 'feed_seed_02', feedItemId: 'feed_seed_02', requestId: 'req_seed_02', requesterBusinessName: '(주)푸드마트',     title: '과일주스 소량 생산 가능한 업체', category: 'beverage', desiredVolume: '5,000개',  targetPriceMin: 1500, targetPriceMax: 2500, certificationRequirement: ['HACCP'],           mode: 'public',   isTargeted: false, hasQuoted: false, createdAt: daysAgo(8) },
  { _id: 'feed_seed_03', feedItemId: 'feed_seed_03', requestId: 'req_seed_03', requesterBusinessName: '(주)그린마켓',     title: '유기농 그래놀라 ODM 의뢰',       category: 'health',   desiredVolume: '3,000개',  targetPriceMin: 2000, targetPriceMax: 4000, certificationRequirement: ['HACCP','ORGANIC'], mode: 'public',   isTargeted: false, hasQuoted: false, createdAt: daysAgo(7) },
  { _id: 'feed_seed_04', feedItemId: 'feed_seed_04', requestId: 'req_seed_04', requesterBusinessName: '(주)그린마켓',     title: '냉동만두 대량생산 파트너 모집',   category: 'frozen',   desiredVolume: '50톤',     targetPriceMin: 500,  targetPriceMax: 900,  certificationRequirement: ['HACCP'],           mode: 'targeted', isTargeted: true,  hasQuoted: false, createdAt: daysAgo(5) },
  { _id: 'feed_seed_05', feedItemId: 'feed_seed_05', requestId: 'req_seed_05', requesterBusinessName: '(주)편의점프레시', title: 'PB 베이커리 제조 파트너',         category: 'bakery',   desiredVolume: '20,000개', targetPriceMin: 600,  targetPriceMax: 1000, certificationRequirement: ['HACCP'],           mode: 'public',   isTargeted: false, hasQuoted: false, createdAt: daysAgo(3) }
];
feed.forEach(function(f) { db.supplier_request_feed_view.updateOne({ _id: f._id }, { $set: f }, { upsert: true }); });

// ============================================================
// 9. admin_notice_view (5건)
// ============================================================
var adminNotices = [
  { _id: 'notc_seed_01', noticeId: 'notc_seed_01', title: '잇다 식품매칭 서비스 정식 오픈 안내', excerpt: '식품 제조 B2B 매칭 플랫폼 잇다가 정식 오픈하였습니다.', state: 'published', authorId: 'usr_seed_admin01', publishedAt: daysAgo(60), viewCount: 342, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
  { _id: 'notc_seed_02', noticeId: 'notc_seed_02', title: 'HACCP 인증 지원 프로그램 안내',       excerpt: 'HACCP 취득 희망 공급자 대상 컨설팅 지원 프로그램을 운영합니다.', state: 'published', authorId: 'usr_seed_admin01', publishedAt: daysAgo(30), viewCount: 189, createdAt: daysAgo(30), updatedAt: daysAgo(30) },
  { _id: 'notc_seed_03', noticeId: 'notc_seed_03', title: '2026년 상반기 식품 트렌드 리포트',    excerpt: '2026년 상반기 주요 식품 트렌드를 공유합니다.', state: 'published', authorId: 'usr_seed_admin02', publishedAt: daysAgo(14), viewCount: 95, createdAt: daysAgo(14), updatedAt: daysAgo(14) },
  { _id: 'notc_seed_04', noticeId: 'notc_seed_04', title: '시스템 점검 예정 안내 (작성중)',       excerpt: '시스템 정기 점검이 예정되어 있습니다.', state: 'draft', authorId: 'usr_seed_admin01', publishedAt: null, viewCount: 0, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { _id: 'notc_seed_05', noticeId: 'notc_seed_05', title: '2025년 연말 이벤트 종료 안내',         excerpt: '2025년 연말 가입 이벤트가 종료되었습니다.', state: 'archived', authorId: 'usr_seed_admin01', publishedAt: daysAgo(90), viewCount: 567, createdAt: daysAgo(100), updatedAt: daysAgo(7) }
];
adminNotices.forEach(function(n) { db.admin_notice_view.updateOne({ _id: n._id }, { $set: n }, { upsert: true }); });

// ============================================================
// 10. public_notice_view (게시됨 3건만)
// ============================================================
var publicNotices = [
  { _id: 'notc_seed_01', noticeId: 'notc_seed_01', title: '잇다 식품매칭 서비스 정식 오픈 안내', excerpt: '식품 제조 B2B 매칭 플랫폼 잇다가 정식 오픈하였습니다.', publishedAt: daysAgo(60), viewCount: 342 },
  { _id: 'notc_seed_02', noticeId: 'notc_seed_02', title: 'HACCP 인증 지원 프로그램 안내',       excerpt: 'HACCP 취득 희망 공급자 대상 컨설팅 지원 프로그램을 운영합니다.', publishedAt: daysAgo(30), viewCount: 189 },
  { _id: 'notc_seed_03', noticeId: 'notc_seed_03', title: '2026년 상반기 식품 트렌드 리포트',    excerpt: '2026년 상반기 주요 식품 트렌드를 공유합니다.', publishedAt: daysAgo(14), viewCount: 95 }
];
publicNotices.forEach(function(n) { db.public_notice_view.updateOne({ _id: n._id }, { $set: n }, { upsert: true }); });

// ============================================================
// 검증
// ============================================================
print('=== MongoDB seed complete ===');
print('user_me_view: ' + db.user_me_view.countDocuments({}));
print('requester_business_profile_view: ' + db.requester_business_profile_view.countDocuments({}));
print('supplier_search_view: ' + db.supplier_search_view.countDocuments({}));
print('supplier_detail_view: ' + db.supplier_detail_view.countDocuments({}));
print('admin_review_queue_view: ' + db.admin_review_queue_view.countDocuments({}));
print('admin_review_detail_view: ' + db.admin_review_detail_view.countDocuments({}));
print('requester_request_summary_view: ' + db.requester_request_summary_view.countDocuments({}));
print('supplier_request_feed_view: ' + db.supplier_request_feed_view.countDocuments({}));
print('admin_notice_view: ' + db.admin_notice_view.countDocuments({}));
print('public_notice_view: ' + db.public_notice_view.countDocuments({}));
