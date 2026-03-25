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
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE targeted_supplier_link (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  supplier_profile_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  UNIQUE KEY uk_request_supplier (request_id, supplier_profile_id)
);

CREATE TABLE quote (
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
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE KEY uk_active_quote (request_id, supplier_profile_id, state)
);

CREATE TABLE message_thread (
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
  created_at TIMESTAMP NOT NULL,
  UNIQUE KEY uk_request_participant_thread (request_id, requester_user_id, supplier_profile_id)
);

CREATE TABLE thread_message (
  id VARCHAR(64) PRIMARY KEY,
  thread_id VARCHAR(64) NOT NULL,
  sender_user_id VARCHAR(64) NOT NULL,
  body TEXT NULL,
  attachment_ids TEXT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE thread_participant_read_state (
  id VARCHAR(64) PRIMARY KEY,
  thread_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  last_read_at TIMESTAMP NOT NULL,
  UNIQUE KEY uk_thread_read_state (thread_id, user_id)
);

CREATE TABLE supplier_profile (
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
