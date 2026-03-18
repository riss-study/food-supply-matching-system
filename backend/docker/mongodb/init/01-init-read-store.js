db = db.getSiblingDB('fsm_read');
db.createCollection('task01_bootstrap_marker');
db.task01_bootstrap_marker.updateOne(
  { name: 'backend-bootstrap' },
  { $set: { name: 'backend-bootstrap', initializedAt: new Date() } },
  { upsert: true }
);
