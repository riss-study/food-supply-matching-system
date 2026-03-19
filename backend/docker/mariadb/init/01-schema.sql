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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_profile (
  id VARCHAR(64) PRIMARY KEY,
  supplier_user_id VARCHAR(64) NOT NULL UNIQUE,
  company_name VARCHAR(100) NOT NULL,
  representative_name VARCHAR(50) NOT NULL,
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
