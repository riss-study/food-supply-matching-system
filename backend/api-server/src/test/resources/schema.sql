CREATE TABLE user_account (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE business_profile (
  id VARCHAR(64) PRIMARY KEY,
  user_account_id VARCHAR(64) NOT NULL UNIQUE,
  business_name VARCHAR(100) NOT NULL,
  business_registration_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  verification_scope VARCHAR(20) NOT NULL,
  approval_state VARCHAR(32) NOT NULL,
  submitted_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  rejection_reason VARCHAR(255) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_business_profile_user_account FOREIGN KEY (user_account_id) REFERENCES user_account(id)
);

CREATE TABLE request_record (
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
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE supplier_profile (
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
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE certification_record (
  id VARCHAR(64) PRIMARY KEY,
  supplier_profile_id VARCHAR(64) NOT NULL,
  type VARCHAR(50) NOT NULL,
  number VARCHAR(255) NULL,
  file_attachment_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE verification_submission (
  id VARCHAR(64) PRIMARY KEY,
  supplier_profile_id VARCHAR(64) NOT NULL,
  state VARCHAR(32) NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by VARCHAR(64) NULL,
  review_note_internal TEXT NULL,
  review_note_public TEXT NULL
);
