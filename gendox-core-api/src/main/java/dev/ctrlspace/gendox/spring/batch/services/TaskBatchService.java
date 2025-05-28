package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TaskBatchService {

    @Value("${gendox.batch-jobs.task-job.job.name}")
    private String taskJobName;

    @Autowired
    private Job taskJob;
    @Autowired
    private JobLauncher jobLauncher;

    public JobExecution runTaskJob(Task task) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {
        JobParameters params = new JobParametersBuilder()
                .addString("taskId", task.getId().toString())
                .addString("taskType", task.getTaskType().getName())
                .toJobParameters();

        return jobLauncher.run(taskJob, params);

    }
}
