CREATE TABLE IF NOT EXISTS task01_bootstrap_marker (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO task01_bootstrap_marker (name)
SELECT 'backend-bootstrap'
WHERE NOT EXISTS (
  SELECT 1 FROM task01_bootstrap_marker WHERE name = 'backend-bootstrap'
);
