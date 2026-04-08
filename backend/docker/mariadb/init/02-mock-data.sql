-- ============================================================
-- 잇다(food2008) 목업 시드 데이터
-- 식품 제조 B2B 매칭 플랫폼 테스트용 목업 데이터
-- 모든 비밀번호: Test1234!
-- 실행: seed-mariadb.sh 또는 직접 실행
-- ============================================================

-- 1. 기존 시드 데이터 + 시드 이메일과 충돌하는 잔여 데이터 정리 (FK 역순)
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM thread_message WHERE id LIKE 'msg\_seed\_%';
DELETE FROM thread_participant_read_state WHERE id LIKE 'trs\_seed\_%';
DELETE FROM message_thread WHERE id LIKE 'thd\_seed\_%';
DELETE FROM quote WHERE id LIKE 'quo\_seed\_%';
DELETE FROM targeted_supplier_link WHERE id LIKE 'tsl\_seed\_%';
DELETE FROM request_record WHERE id LIKE 'req\_seed\_%';
DELETE FROM certification_record WHERE id LIKE 'cert\_seed\_%';
DELETE FROM attachment_metadata WHERE id LIKE 'att\_seed\_%';
DELETE FROM verification_submission WHERE id LIKE 'vsub\_seed\_%';
DELETE FROM supplier_profile WHERE id LIKE 'sprof\_seed\_%';
DELETE FROM notice WHERE id LIKE 'notc\_seed\_%';
DELETE FROM audit_log WHERE id LIKE 'audit\_seed\_%';
DELETE FROM business_profile WHERE id LIKE 'bprof\_seed\_%';
DELETE FROM user_account WHERE id LIKE 'usr\_seed\_%';

-- 시드 이메일과 충돌하는 기존 잔여 계정도 정리
DELETE bp FROM business_profile bp
  INNER JOIN user_account ua ON bp.user_account_id = ua.id
  WHERE ua.email IN ('admin@test.com','admin2@test.com','buyer@test.com','buyer2@test.com','buyer3@test.com','buyer4@test.com','buyer5@test.com','supplier@test.com','supplier2@test.com','supplier3@test.com','supplier4@test.com','supplier5@test.com','supplier6@test.com','supplier7@test.com','supplier8@test.com');
DELETE sp FROM supplier_profile sp
  INNER JOIN user_account ua ON sp.supplier_user_id = ua.id
  WHERE ua.email IN ('admin@test.com','admin2@test.com','buyer@test.com','buyer2@test.com','buyer3@test.com','buyer4@test.com','buyer5@test.com','supplier@test.com','supplier2@test.com','supplier3@test.com','supplier4@test.com','supplier5@test.com','supplier6@test.com','supplier7@test.com','supplier8@test.com');
DELETE FROM user_account WHERE email IN ('admin@test.com','admin2@test.com','buyer@test.com','buyer2@test.com','buyer3@test.com','buyer4@test.com','buyer5@test.com','supplier@test.com','supplier2@test.com','supplier3@test.com','supplier4@test.com','supplier5@test.com','supplier6@test.com','supplier7@test.com','supplier8@test.com');

SET FOREIGN_KEY_CHECKS = 1;

-- BCrypt hash for 'Test1234!' (모든 시드 계정 공통 비밀번호)
-- 평문: Test1234!
SET @PW = '$2a$10$byaAb13ApzqHWtTyrROgWOd/D9vKsNJ2aOZFcHhGPQOBWCYUK1Kvq';

-- ============================================================
-- 2. 사용자 계정 (15명: 관리자2 + 요청자5 + 공급자8)
-- ============================================================
INSERT INTO user_account (id, email, password_hash, role, created_at) VALUES
('usr_seed_admin01',    'admin@test.com',      @PW, 'ADMIN',     DATE_SUB(NOW(), INTERVAL 90 DAY)),
('usr_seed_admin02',    'admin2@test.com',     @PW, 'ADMIN',     DATE_SUB(NOW(), INTERVAL 60 DAY)),
('usr_seed_buyer01',    'buyer@test.com',      @PW, 'REQUESTER', DATE_SUB(NOW(), INTERVAL 80 DAY)),
('usr_seed_buyer02',    'buyer2@test.com',     @PW, 'REQUESTER', DATE_SUB(NOW(), INTERVAL 70 DAY)),
('usr_seed_buyer03',    'buyer3@test.com',     @PW, 'REQUESTER', DATE_SUB(NOW(), INTERVAL 50 DAY)),
('usr_seed_buyer04',    'buyer4@test.com',     @PW, 'REQUESTER', DATE_SUB(NOW(), INTERVAL 40 DAY)),
('usr_seed_buyer05',    'buyer5@test.com',     @PW, 'REQUESTER', DATE_SUB(NOW(), INTERVAL 20 DAY)),
('usr_seed_supplier01', 'supplier@test.com',   @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 85 DAY)),
('usr_seed_supplier02', 'supplier2@test.com',  @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 75 DAY)),
('usr_seed_supplier03', 'supplier3@test.com',  @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 65 DAY)),
('usr_seed_supplier04', 'supplier4@test.com',  @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 55 DAY)),
('usr_seed_supplier05', 'supplier5@test.com',  @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 45 DAY)),
('usr_seed_supplier06', 'supplier6@test.com',  @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 35 DAY)),
('usr_seed_supplier07', 'supplier7@test.com',  @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 25 DAY)),
('usr_seed_supplier08', 'supplier8@test.com',  @PW, 'SUPPLIER',  DATE_SUB(NOW(), INTERVAL 15 DAY))
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- ============================================================
-- 3. 사업자 프로필 (요청자 5명)
-- ============================================================
INSERT INTO business_profile (id, user_account_id, business_name, approval_state, business_registration_number, contact_name, contact_phone, contact_email, verification_scope, submitted_at, approved_at, rejected_at, rejection_reason, created_at, updated_at) VALUES
('bprof_seed_buyer01', 'usr_seed_buyer01', '(주)푸드마트',       'approved',  '123-45-67890', '김바이어', '02-1234-5678', 'buyer@test.com',  'domestic', DATE_SUB(NOW(), INTERVAL 75 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 75 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY)),
('bprof_seed_buyer02', 'usr_seed_buyer02', '(주)그린마켓',       'approved',  '234-56-78901', '이그린', '02-2345-6789', 'buyer2@test.com', 'domestic', DATE_SUB(NOW(), INTERVAL 65 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 65 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
('bprof_seed_buyer03', 'usr_seed_buyer03', '(주)헬스푸드코리아', 'submitted', '345-67-89012', '박건강', '02-3456-7890', 'buyer3@test.com', 'domestic', DATE_SUB(NOW(), INTERVAL 5 DAY),  NULL, NULL, NULL, DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('bprof_seed_buyer04', 'usr_seed_buyer04', '(주)편의점프레시',   'approved',  '456-78-90123', '최프레', '02-4567-8901', 'buyer4@test.com', 'domestic', DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, NULL, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
('bprof_seed_buyer05', 'usr_seed_buyer05', '(주)온라인몰다이렉트','rejected', '567-89-01234', '정온라', '02-5678-9012', 'buyer5@test.com', 'domestic', DATE_SUB(NOW(), INTERVAL 18 DAY), NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), '사업자등록증 확인 불가', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY))
ON DUPLICATE KEY UPDATE business_name=VALUES(business_name);

-- ============================================================
-- 4. 공급자 프로필 (8개사)
-- ============================================================
INSERT INTO supplier_profile (id, supplier_user_id, company_name, representative_name, contact_phone, contact_email, region, categories, equipment_summary, monthly_capacity, moq, oem_available, odm_available, raw_material_support, packaging_labeling_support, introduction, verification_state, exposure_state, created_at, updated_at) VALUES
('sprof_seed_01', 'usr_seed_supplier01', '(주)한맛식품',     '김대한', '031-111-2222', 'supplier@test.com',  '경기 화성',   'snack,frozen',    '자동화 스낵라인 3개, 냉동포장 라인 2개, 품질검사실',          50000, 1000, 1, 1, 1, 1, 'HACCP·ISO 22000 인증 스낵/냉동식품 전문 OEM/ODM 제조사. 30년 전통의 기술력으로 프리미엄 간식류를 생산합니다.',        'approved',  'listed', DATE_SUB(NOW(), INTERVAL 80 DAY), NOW()),
('sprof_seed_02', 'usr_seed_supplier02', '대한음료(주)',     '이음료', '043-222-3333', 'supplier2@test.com', '충북 청주',   'beverage',        'PET 충전라인 2개, 캔 충전라인 1개, 무균충전 설비',            80000, 2000, 1, 0, 1, 1, '음료 전문 제조사. PET, 캔, 파우치 등 다양한 용기에 대응 가능하며 100톤/월 이상 대량 생산 체제를 갖추고 있습니다.', 'approved',  'listed', DATE_SUB(NOW(), INTERVAL 70 DAY), NOW()),
('sprof_seed_03', 'usr_seed_supplier03', '(주)서울베이커리', '박빵집', '02-333-4444',  'supplier3@test.com', '서울 강남',   'bakery,snack',    '오븐 10대, 발효실 3실, 포장라인 2개',                          30000,  500, 1, 1, 0, 1, '프리미엄 베이커리·스낵 전문. 소량 다품종 생산에 강하며 PB 베이커리 OEM/ODM 경험 다수 보유.',                        'approved',  'listed', DATE_SUB(NOW(), INTERVAL 60 DAY), NOW()),
('sprof_seed_04', 'usr_seed_supplier04', '경남소스공업(주)', '정소스', '055-444-5555', 'supplier4@test.com', '경남 김해',   'sauce',           '소스 조합탱크 5기, 충전라인 3개, 살균설비',                    20000, 3000, 1, 0, 1, 0, '간장, 고추장, 드레싱 등 소스류 전문 OEM. HACCP 인증 완료.',                                                       'approved',  'hidden', DATE_SUB(NOW(), INTERVAL 50 DAY), NOW()),
('sprof_seed_05', 'usr_seed_supplier05', '(주)제주유기농',   '오유기', '064-555-6666', 'supplier5@test.com', '제주',        'dairy,health',    '유기농 인증 가공시설, 저온살균 설비, 분말화 설비',              15000,  200, 0, 1, 0, 0, '제주 청정 원료 기반 유기농 건강식품·유제품 전문. 소량 프리미엄 제품에 특화.',                                       'submitted', 'hidden', DATE_SUB(NOW(), INTERVAL 40 DAY), NOW()),
('sprof_seed_06', 'usr_seed_supplier06', '부산수산식품(주)', '최수산', '051-666-7777', 'supplier6@test.com', '부산 사하',   'frozen,other',    '급속냉동기 3대, IQF 라인, 진공포장 설비',                      40000, 1500, 1, 0, 1, 1, '수산물 기반 냉동식품 전문. 급속냉동 기술로 신선도를 유지합니다.',                                                   'draft',     'hidden', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
('sprof_seed_07', 'usr_seed_supplier07', '(주)전주명가',     '한전주', '063-777-8888', 'supplier7@test.com', '전북 전주',   'sauce,snack',     '전통 장류 숙성고 10동, 소스라인 2개',                          25000,  800, 0, 1, 0, 0, '전통 장류 및 간식 전문 ODM. 전주 전통 레시피를 현대화한 제품 개발.',                                               'rejected',  'hidden', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
('sprof_seed_08', 'usr_seed_supplier08', '인천냉동식품(주)', '임냉동', '032-888-9999', 'supplier8@test.com', '인천 남동',   'frozen',          '대형 냉동창고 2동, 만두라인 4개, 포장라인 3개',                60000, 5000, 1, 1, 1, 1, '냉동만두·냉동밥류 대량생산 전문. 월 60톤 이상 생산 가능.',                                                         'hold',      'hidden', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW())
ON DUPLICATE KEY UPDATE company_name=VALUES(company_name);

-- ============================================================
-- 5. 검수 제출 (6건: 승인3 + 제출1 + 반려1 + 보류1)
-- ============================================================
INSERT INTO verification_submission (id, supplier_profile_id, state, submitted_at, reviewed_at, reviewed_by, review_note_internal, review_note_public) VALUES
('vsub_seed_01', 'sprof_seed_01', 'approved',  DATE_SUB(NOW(), INTERVAL 75 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY), 'usr_seed_admin01', 'HACCP/ISO 확인 완료', '검수 완료. 정상 승인.'),
('vsub_seed_02', 'sprof_seed_02', 'approved',  DATE_SUB(NOW(), INTERVAL 65 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY), 'usr_seed_admin01', '음료 전문 설비 확인', '검수 완료.'),
('vsub_seed_03', 'sprof_seed_03', 'approved',  DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY), 'usr_seed_admin02', 'HACCP 확인', '검수 완료.'),
('vsub_seed_04', 'sprof_seed_05', 'submitted', DATE_SUB(NOW(), INTERVAL 3 DAY),  NULL, NULL, NULL, NULL),
('vsub_seed_05', 'sprof_seed_07', 'rejected',  DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), 'usr_seed_admin01', 'HACCP 인증서 유효기간 만료', '인증서 유효기간이 만료되었습니다. 갱신 후 재제출해주세요.'),
('vsub_seed_06', 'sprof_seed_08', 'hold',      DATE_SUB(NOW(), INTERVAL 7 DAY),  NULL, NULL, '사업자등록증 사본 해상도 불량, 재요청 예정', NULL)
ON DUPLICATE KEY UPDATE state=VALUES(state);

-- ============================================================
-- 6. 인증 기록 (10건)
-- ============================================================
INSERT INTO certification_record (id, supplier_profile_id, type, number, file_attachment_id, status, created_at) VALUES
('cert_seed_01', 'sprof_seed_01', 'HACCP',    'HACCP-2024-001', 'att_seed_cert01', 'approved',  DATE_SUB(NOW(), INTERVAL 75 DAY)),
('cert_seed_02', 'sprof_seed_01', 'ISO22000', 'ISO-2024-001',   'att_seed_cert02', 'approved',  DATE_SUB(NOW(), INTERVAL 75 DAY)),
('cert_seed_03', 'sprof_seed_02', 'HACCP',    'HACCP-2024-002', 'att_seed_cert03', 'approved',  DATE_SUB(NOW(), INTERVAL 65 DAY)),
('cert_seed_04', 'sprof_seed_02', 'FSSC22000','FSSC-2024-001',  'att_seed_cert04', 'submitted', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('cert_seed_05', 'sprof_seed_03', 'HACCP',    'HACCP-2024-003', 'att_seed_cert05', 'approved',  DATE_SUB(NOW(), INTERVAL 55 DAY)),
('cert_seed_06', 'sprof_seed_04', 'HACCP',    'HACCP-2024-004', 'att_seed_cert06', 'approved',  DATE_SUB(NOW(), INTERVAL 45 DAY)),
('cert_seed_07', 'sprof_seed_05', 'ORGANIC',  'ORG-2024-001',   'att_seed_cert07', 'submitted', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('cert_seed_08', 'sprof_seed_05', 'HACCP',    'HACCP-2024-005', 'att_seed_cert08', 'submitted', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('cert_seed_09', 'sprof_seed_07', 'HACCP',    'HACCP-2023-EXP', 'att_seed_cert09', 'submitted', DATE_SUB(NOW(), INTERVAL 15 DAY)),
('cert_seed_10', 'sprof_seed_08', 'HACCP',    'HACCP-2024-006', 'att_seed_cert10', 'submitted', DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE type=VALUES(type);

-- ============================================================
-- 7. 의뢰 (8건: open4 + closed1 + cancelled1 + draft2)
-- ============================================================
INSERT INTO request_record (id, requester_user_id, mode, title, category, desired_volume, target_price_min, target_price_max, certification_requirement, raw_material_rule, packaging_requirement, delivery_requirement, notes, state, created_at, updated_at) VALUES
('req_seed_01', 'usr_seed_buyer01', 'public',   '프로틴바 OEM 제조사 찾습니다',        'snack',    10000, 800,  1200, 'HACCP',         'supplier_provided', 'private_label', '계약 후 30일 이내', '유기농 원료 사용 필수. 개별포장 50g 기준.', 'open', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
('req_seed_02', 'usr_seed_buyer01', 'public',   '과일주스 소량 생산 가능한 업체',       'beverage',  5000, 1500, 2500, 'HACCP',         'requester_provided', 'bulk',         '2개월 이내',        'NFC 과일주스. 원료는 당사에서 공급.',       'open', DATE_SUB(NOW(), INTERVAL 8 DAY),  NOW()),
('req_seed_03', 'usr_seed_buyer02', 'public',   '유기농 그래놀라 ODM 의뢰',             'health',    3000, 2000, 4000, 'HACCP,ORGANIC', 'supplier_provided', 'private_label', '45일 이내',         '유기농 인증 필수. 견과류 기반 그래놀라.',   'open', DATE_SUB(NOW(), INTERVAL 7 DAY),  NOW()),
('req_seed_04', 'usr_seed_buyer02', 'targeted', '냉동만두 대량생산 파트너 모집',         'frozen',   50000, 500,  900,  'HACCP',         'supplier_provided', 'bulk',         '매월 납품',         '김치만두·고기만두 2종. 월 50톤 이상.',     'open', DATE_SUB(NOW(), INTERVAL 5 DAY),  NOW()),
('req_seed_05', 'usr_seed_buyer04', 'public',   'PB 베이커리 제조 파트너',               'bakery',   20000, 600,  1000, 'HACCP',         'supplier_provided', 'private_label', '3개월 이내',        '편의점 PB 빵류. 다품종 소량 대응 필요.',   'open', DATE_SUB(NOW(), INTERVAL 3 DAY),  NOW()),
('req_seed_06', 'usr_seed_buyer01', 'public',   '간장소스류 OEM 제조 완료건',            'sauce',     8000, 2000, 3500, 'HACCP',         'requester_provided', NULL,           '완료',              '간장·불고기소스 2종. 납품 완료.',          'closed', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
('req_seed_07', 'usr_seed_buyer04', 'targeted', '도시락 반찬류 냉동제품 (취소)',          'frozen',   15000, 700,  1100, 'HACCP',         'supplier_provided', 'bulk',         NULL,                '예산 사정으로 취소.',                       'cancelled', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
('req_seed_08', 'usr_seed_buyer02', 'public',   '건강음료 시제품 개발 (작성중)',          'beverage',  1000, 3000, 5000, NULL,            NULL,                 NULL,           NULL,                NULL,                                        'draft', DATE_SUB(NOW(), INTERVAL 1 DAY),  NOW())
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- ============================================================
-- 8. 지정 공급자 링크
-- ============================================================
INSERT INTO targeted_supplier_link (id, request_id, supplier_profile_id, created_at) VALUES
('tsl_seed_01', 'req_seed_04', 'sprof_seed_01', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('tsl_seed_02', 'req_seed_04', 'sprof_seed_08', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('tsl_seed_03', 'req_seed_07', 'sprof_seed_01', DATE_SUB(NOW(), INTERVAL 20 DAY))
ON DUPLICATE KEY UPDATE request_id=VALUES(request_id);

-- ============================================================
-- 9. 견적 (6건: submitted3 + selected1 + withdrawn1 + declined1)
-- ============================================================
INSERT INTO quote (id, request_id, supplier_profile_id, unit_price_estimate, moq, lead_time, sample_cost, note, state, version, created_at, updated_at) VALUES
('quo_seed_01', 'req_seed_01', 'sprof_seed_01',  950, 2000, 21, 50000,  'HACCP 인증 완료. 프로틴바 OEM 다수 경험.',       'submitted', 1, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
('quo_seed_02', 'req_seed_01', 'sprof_seed_03', 1100, 1000, 28, 30000,  '소량부터 대응 가능. 맞춤 레시피 개발 포함.',     'submitted', 1, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
('quo_seed_03', 'req_seed_02', 'sprof_seed_02', 1800, 3000, 14, NULL,   'PET 500ml 기준. 대량 시 단가 협의 가능.',        'submitted', 1, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('quo_seed_04', 'req_seed_03', 'sprof_seed_01', 2800, 1000, 30, 80000,  '유기농 원료 조달 가능. 그래놀라 ODM 경험 있음.',  'submitted', 1, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
('quo_seed_05', 'req_seed_06', 'sprof_seed_04', 2500, 5000, 21, NULL,   '간장·불고기소스 제조 완료. 납품 확정.',           'selected',  1, DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
('quo_seed_06', 'req_seed_05', 'sprof_seed_03', 850,   500, 35, 20000,  '단가 재협의 희망으로 철회.',                       'withdrawn', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW())
ON DUPLICATE KEY UPDATE state=VALUES(state);

-- ============================================================
-- 10. 메시지 스레드 (4건)
-- ============================================================
INSERT INTO message_thread (id, request_id, requester_user_id, supplier_profile_id, quote_id, contact_share_state, created_at) VALUES
('thd_seed_01', 'req_seed_01', 'usr_seed_buyer01', 'sprof_seed_01', 'quo_seed_01', 'not_requested',    DATE_SUB(NOW(), INTERVAL 7 DAY)),
('thd_seed_02', 'req_seed_01', 'usr_seed_buyer01', 'sprof_seed_03', 'quo_seed_02', 'not_requested',    DATE_SUB(NOW(), INTERVAL 6 DAY)),
('thd_seed_03', 'req_seed_02', 'usr_seed_buyer01', 'sprof_seed_02', 'quo_seed_03', 'not_requested',    DATE_SUB(NOW(), INTERVAL 5 DAY)),
('thd_seed_04', 'req_seed_06', 'usr_seed_buyer01', 'sprof_seed_04', 'quo_seed_05', 'mutually_approved', DATE_SUB(NOW(), INTERVAL 25 DAY))
ON DUPLICATE KEY UPDATE contact_share_state=VALUES(contact_share_state);

-- ============================================================
-- 11. 메시지 (12건)
-- ============================================================
INSERT INTO thread_message (id, thread_id, sender_user_id, body, attachment_ids, created_at) VALUES
('msg_seed_01', 'thd_seed_01', 'usr_seed_buyer01',    '안녕하세요, 프로틴바 OEM 관련 문의드립니다. 견적서 잘 받았습니다.',         NULL, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('msg_seed_02', 'thd_seed_01', 'usr_seed_supplier01', '안녕하세요. 네, 프로틴바 OEM 다수 진행한 경험이 있습니다. MOQ 관련 조율 가능합니다.', NULL, DATE_SUB(NOW(), INTERVAL 6 DAY)),
('msg_seed_03', 'thd_seed_01', 'usr_seed_buyer01',    'MOQ 1000개로 시작 가능할까요? 샘플 먼저 받아보고 싶습니다.',               NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('msg_seed_04', 'thd_seed_02', 'usr_seed_buyer01',    '서울베이커리님, 견적 감사합니다. 소량 대응이 가능하다니 좋네요.',           NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('msg_seed_05', 'thd_seed_02', 'usr_seed_supplier03', '네, 500개부터 가능합니다. 맞춤 레시피 개발도 포함되어 있으니 참고해주세요.', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('msg_seed_06', 'thd_seed_03', 'usr_seed_buyer01',    '과일주스 NFC 방식으로 진행 가능하신가요?',                                  NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('msg_seed_07', 'thd_seed_03', 'usr_seed_supplier02', '네, NFC 착즙 설비 보유하고 있습니다. 원료 납품 일정만 확인되면 바로 착수 가능합니다.', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('msg_seed_08', 'thd_seed_03', 'usr_seed_buyer01',    '좋습니다. 샘플 요청 드려도 될까요?',                                        NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('msg_seed_09', 'thd_seed_04', 'usr_seed_buyer01',    '소스류 납품 관련 최종 조율 부탁드립니다.',                                   NULL, DATE_SUB(NOW(), INTERVAL 24 DAY)),
('msg_seed_10', 'thd_seed_04', 'usr_seed_supplier04', '네, 간장·불고기소스 2종 모두 준비 완료되었습니다. 납품일 확정해주세요.',      NULL, DATE_SUB(NOW(), INTERVAL 23 DAY)),
('msg_seed_11', 'thd_seed_04', 'usr_seed_buyer01',    '다음주 월요일 납품 부탁드립니다. 연락처 공유 요청드립니다.',                  NULL, DATE_SUB(NOW(), INTERVAL 22 DAY)),
('msg_seed_12', 'thd_seed_04', 'usr_seed_supplier04', '확인했습니다. 연락처 공유 승인합니다.',                                      NULL, DATE_SUB(NOW(), INTERVAL 21 DAY))
ON DUPLICATE KEY UPDATE body=VALUES(body);

-- ============================================================
-- 12. 공지사항 (5건: published3 + draft1 + archived1)
-- ============================================================
INSERT INTO notice (id, title, body, state, author_id, published_at, view_count, created_at, updated_at) VALUES
('notc_seed_01', '잇다 식품매칭 서비스 정식 오픈 안내', '안녕하세요, 잇다 운영팀입니다.\n\n식품 제조 B2B 매칭 플랫폼 잇다가 정식 오픈하였습니다.\n\nHACCP, ISO 인증 제조사부터 OEM/ODM 전문 업체까지 검증된 공급자 네트워크에서 최적의 파트너를 찾아보세요.\n\n감사합니다.\n잇다 운영팀 드림', 'published', 'usr_seed_admin01', DATE_SUB(NOW(), INTERVAL 60 DAY), 342, DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
('notc_seed_02', 'HACCP 인증 지원 프로그램 안내',       '식품안전관리인증(HACCP) 취득을 희망하는 공급자를 대상으로 인증 컨설팅 지원 프로그램을 운영합니다.\n\n대상: 잇다 등록 공급자\n기간: 2026년 상반기\n지원 내용: HACCP 컨설팅 비용 50% 지원\n\n자세한 사항은 고객센터로 문의해주세요.', 'published', 'usr_seed_admin01', DATE_SUB(NOW(), INTERVAL 30 DAY), 189, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
('notc_seed_03', '2026년 상반기 식품 트렌드 리포트',    '2026년 상반기 주요 식품 트렌드를 공유합니다.\n\n1. 단백질 강화 간식류 수요 증가\n2. 저당/무설탕 음료 시장 확대\n3. 비건/식물성 식품 ODM 수요 급증\n4. 친환경 포장재 전환 가속화\n\n해당 카테고리의 제조 역량을 갖춘 공급자분들의 많은 관심 바랍니다.', 'published', 'usr_seed_admin02', DATE_SUB(NOW(), INTERVAL 14 DAY), 95, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
('notc_seed_04', '시스템 점검 예정 안내 (작성중)',       '아래 일정으로 시스템 정기 점검이 예정되어 있습니다.\n\n일시: 미정\n영향 범위: 미정\n\n확정 시 재공지 예정.', 'draft', 'usr_seed_admin01', NULL, 0, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('notc_seed_05', '2025년 연말 이벤트 종료 안내',         '2025년 연말 가입 이벤트가 종료되었습니다.\n\n참여해주신 모든 분들께 감사드립니다.\n다음 이벤트를 기대해주세요.', 'archived', 'usr_seed_admin01', DATE_SUB(NOW(), INTERVAL 90 DAY), 567, DATE_SUB(NOW(), INTERVAL 100 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE title=VALUES(title);
