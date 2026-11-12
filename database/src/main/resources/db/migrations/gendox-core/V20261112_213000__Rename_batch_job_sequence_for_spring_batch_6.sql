-- Spring Batch 6 (Spring Boot 4) reads job instance ids from BATCH_JOB_INSTANCE_SEQ; version 5 named it BATCH_JOB_SEQ.
-- From spring-batch-core 6.0: org/springframework/batch/core/migration/6.0/migration-postgresql.sql
--
-- Deploy this together with the Spring Boot 4 backend: an API still on Spring Batch 5 cannot start jobs
-- once the sequence is renamed.
ALTER SEQUENCE IF EXISTS gendox_jobs.batch_job_seq RENAME TO batch_job_instance_seq;
