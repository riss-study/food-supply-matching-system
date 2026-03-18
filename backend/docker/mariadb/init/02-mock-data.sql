INSERT INTO task01_bootstrap_marker (name)
SELECT 'requester-approved-seed'
WHERE NOT EXISTS (
  SELECT 1 FROM task01_bootstrap_marker WHERE name = 'requester-approved-seed'
);

INSERT INTO task01_bootstrap_marker (name)
SELECT 'supplier-approved-seed'
WHERE NOT EXISTS (
  SELECT 1 FROM task01_bootstrap_marker WHERE name = 'supplier-approved-seed'
);

INSERT INTO task01_bootstrap_marker (name)
SELECT 'request-open-seed'
WHERE NOT EXISTS (
  SELECT 1 FROM task01_bootstrap_marker WHERE name = 'request-open-seed'
);
