CREATE TABLE IF NOT EXISTS task01_bootstrap_marker (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_account (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_profile (
  id VARCHAR(64) PRIMARY KEY,
  user_account_id VARCHAR(64) NOT NULL UNIQUE,
  business_name VARCHAR(100) NOT NULL,
  approval_state VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_business_profile_user_account FOREIGN KEY (user_account_id) REFERENCES user_account(id)
);

CREATE TABLE IF NOT EXISTS request_record (
  id VARCHAR(64) PRIMARY KEY,
  requester_user_id VARCHAR(64) NOT NULL,
  mode VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  desired_volume INT NOT NULL,
  target_price_min INT NULL,
  target_price_max INT NULL,
  certification_requirement TEXT NULL,
  raw_material_rule VARCHAR(50) NULL,
  packaging_requirement VARCHAR(50) NULL,
  delivery_requirement VARCHAR(50) NULL,
  notes TEXT NULL,
  state VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS targeted_supplier_link (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  supplier_profile_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_request_supplier (request_id, supplier_profile_id)
);

CREATE TABLE IF NOT EXISTS quote (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  supplier_profile_id VARCHAR(64) NOT NULL,
  unit_price_estimate INT NOT NULL,
  moq INT NOT NULL,
  lead_time INT NOT NULL,
  sample_cost INT NULL,
  note TEXT NULL,
  state VARCHAR(32) NOT NULL,
  version INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quote_request FOREIGN KEY (request_id) REFERENCES request_record(id),
  CONSTRAINT fk_quote_supplier FOREIGN KEY (supplier_profile_id) REFERENCES supplier_profile(id),
  UNIQUE KEY uk_active_quote (request_id, supplier_profile_id, state)
);

CREATE TABLE IF NOT EXISTS message_thread (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  requester_user_id VARCHAR(64) NOT NULL,
  supplier_profile_id VARCHAR(64) NOT NULL,
  quote_id VARCHAR(64) NULL,
  contact_share_state VARCHAR(32) NOT NULL DEFAULT 'not_requested',
  contact_share_requested_by_role VARCHAR(32) NULL,
  contact_share_requested_at TIMESTAMP NULL,
  contact_share_requester_approved_at TIMESTAMP NULL,
  contact_share_supplier_approved_at TIMESTAMP NULL,
  contact_share_revoked_by_role VARCHAR(32) NULL,
  contact_share_revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_request_participant_thread (request_id, requester_user_id, supplier_profile_id),
  CONSTRAINT fk_thread_request FOREIGN KEY (request_id) REFERENCES request_record(id),
  CONSTRAINT fk_thread_quote FOREIGN KEY (quote_id) REFERENCES quote(id)
);

CREATE TABLE IF NOT EXISTS thread_message (
  id VARCHAR(64) PRIMARY KEY,
  thread_id VARCHAR(64) NOT NULL,
  sender_user_id VARCHAR(64) NOT NULL,
  body TEXT NULL,
  attachment_ids TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_thread_message_thread FOREIGN KEY (thread_id) REFERENCES message_thread(id)
);

CREATE TABLE IF NOT EXISTS thread_participant_read_state (
  id VARCHAR(64) PRIMARY KEY,
  thread_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  last_read_at TIMESTAMP NOT NULL,
  UNIQUE KEY uk_thread_read_state (thread_id, user_id),
  CONSTRAINT fk_thread_read_state_thread FOREIGN KEY (thread_id) REFERENCES message_thread(id)
);

CREATE TABLE IF NOT EXISTS supplier_profile (
  id VARCHAR(64) PRIMARY KEY,
  supplier_user_id VARCHAR(64) NOT NULL UNIQUE,
  company_name VARCHAR(100) NOT NULL,
  representative_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(64) NULL,
  contact_email VARCHAR(255) NULL,
  region VARCHAR(100) NOT NULL,
  categories TEXT NOT NULL,
  equipment_summary VARCHAR(500) NULL,
  monthly_capacity INT NOT NULL,
  moq INT NOT NULL,
  oem_available BOOLEAN NOT NULL,
  odm_available BOOLEAN NOT NULL,
  raw_material_support BOOLEAN NOT NULL,
  packaging_labeling_support BOOLEAN NOT NULL,
  introduction TEXT NULL,
  verification_state VARCHAR(32) NOT NULL,
  exposure_state VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certification_record (
  id VARCHAR(64) PRIMARY KEY,
  supplier_profile_id VARCHAR(64) NOT NULL,
  type VARCHAR(50) NOT NULL,
  number VARCHAR(255) NULL,
  file_attachment_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attachment_metadata (
  id VARCHAR(64) PRIMARY KEY,
  owner_type VARCHAR(64) NOT NULL,
  owner_id VARCHAR(64) NOT NULL,
  attachment_kind VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(128) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_submission (
  id VARCHAR(64) PRIMARY KEY,
  supplier_profile_id VARCHAR(64) NOT NULL,
  state VARCHAR(32) NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by VARCHAR(64) NULL,
  review_note_internal TEXT NULL,
  review_note_public TEXT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(64) PRIMARY KEY,
  actor_user_id VARCHAR(64) NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  payload_snapshot TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(100) NOT NULL DEFAULT 'Unknown';

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(20) NOT NULL DEFAULT '';

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS contact_name VARCHAR(50) NOT NULL DEFAULT '';

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20) NOT NULL DEFAULT '';

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS verification_scope VARCHAR(20) NOT NULL DEFAULT 'domestic';

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NULL;

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL;

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255) NULL;

ALTER TABLE business_profile
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

INSERT INTO task01_bootstrap_marker (name)
SELECT 'backend-bootstrap'
WHERE NOT EXISTS (
  SELECT 1 FROM task01_bootstrap_marker WHERE name = 'backend-bootstrap'
);
