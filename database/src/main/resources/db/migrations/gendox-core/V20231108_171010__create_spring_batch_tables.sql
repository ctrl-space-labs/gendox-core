-- Autogenerated from spring-batch-core-5.0.3.jar!/org/springframework/batch/core/schema-postgresql.sql 
create schema if not exists gendox_jobs;

CREATE SEQUENCE IF NOT EXISTS gendox_jobs.batch_step_execution_seq MAXVALUE 9223372036854775807 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS gendox_jobs.batch_job_execution_seq MAXVALUE 9223372036854775807 NO CYCLE;
CREATE SEQUENCE IF NOT EXISTS gendox_jobs.batch_job_seq MAXVALUE 9223372036854775807 NO CYCLE;


CREATE TABLE IF NOT EXISTS gendox_jobs.batch_job_instance
(
    job_instance_id BIGINT       NOT NULL PRIMARY KEY DEFAULT nextval('gendox_jobs.batch_job_seq'),
    version         BIGINT,
    job_name        VARCHAR(100) NOT NULL,
    job_key         VARCHAR(32)  NOT NULL,
    CONSTRAINT job_inst_un unique (job_name, job_key)
);

CREATE TABLE IF NOT EXISTS gendox_jobs.batch_job_execution
(
    job_execution_id BIGINT    NOT NULL PRIMARY KEY DEFAULT nextval('gendox_jobs.batch_job_execution_seq'),
    version          BIGINT,
    job_instance_id  BIGINT    NOT NULL,
    create_time      timestamp NOT NULL,
    start_time       timestamp                      default null,
    end_time         timestamp                      default null,
    status           VARCHAR(10),
    exit_code        VARCHAR(2500),
    exit_message     VARCHAR(2500),
    last_updated     timestamp,
    CONSTRAINT job_inst_exec_fk foreign key (job_instance_id)
        references gendox_jobs.batch_job_instance (job_instance_id)
);

CREATE TABLE IF NOT EXISTS gendox_jobs.batch_job_execution_params
(
    job_execution_id BIGINT       NOT NULL,
    parameter_name   VARCHAR(100) NOT NULL,
    parameter_type   VARCHAR(100) NOT NULL,
    parameter_value  VARCHAR(2500),
    identifying      char(1)      NOT NULL,
    CONSTRAINT job_exec_params_fk foreign key (job_execution_id)
        references gendox_jobs.batch_job_execution (job_execution_id)
);

CREATE TABLE IF NOT EXISTS gendox_jobs.batch_step_execution
(
    step_execution_id  BIGINT       NOT NULL PRIMARY KEY DEFAULT nextval('gendox_jobs.batch_step_execution_seq'),
    version            BIGINT       NOT NULL,
    step_name          VARCHAR(100) NOT NULL,
    job_execution_id   BIGINT       NOT NULL,
    create_time        timestamp    NOT NULL,
    start_time         timestamp                         default null,
    end_time           timestamp                         default null,
    status             VARCHAR(10),
    commit_count       BIGINT,
    read_count         BIGINT,
    filter_count       BIGINT,
    write_count        BIGINT,
    read_skip_count    BIGINT,
    write_skip_count   BIGINT,
    process_skip_count BIGINT,
    rollback_count     BIGINT,
    exit_code          VARCHAR(2500),
    exit_message       VARCHAR(2500),
    last_updated       timestamp,
    CONSTRAINT job_exec_step_fk foreign key (job_execution_id)
        references gendox_jobs.batch_job_execution (job_execution_id)
);

CREATE TABLE IF NOT EXISTS gendox_jobs.batch_step_execution_context
(
    step_execution_id  BIGINT        NOT NULL PRIMARY KEY,
    short_context      VARCHAR(2500) NOT NULL,
    serialized_context text,
    CONSTRAINT step_exec_ctx_fk foreign key (step_execution_id)
        references gendox_jobs.batch_step_execution (step_execution_id)
);

CREATE TABLE IF NOT EXISTS gendox_jobs.batch_job_execution_context
(
    job_execution_id   BIGINT        NOT NULL PRIMARY KEY,
    short_context      VARCHAR(2500) NOT NULL,
    serialized_context text,
    CONSTRAINT job_exec_ctx_fk foreign key (job_execution_id)
        references gendox_jobs.batch_job_execution (job_execution_id)
);

