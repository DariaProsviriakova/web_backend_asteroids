// This module is imported only by the separate LR3 entry point.
// LR4 keeps its own session guard, storage settings and database.
process.env.DATE_MEDIA_STORAGE = "minio";
process.env.USE_MINIO_SEED_ASSETS = "true";
