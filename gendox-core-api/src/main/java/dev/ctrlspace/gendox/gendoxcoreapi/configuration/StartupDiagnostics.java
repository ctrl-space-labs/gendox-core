package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.File;
import java.lang.management.*;
import java.net.InetAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@Component
public class StartupDiagnostics {

    private static final Logger log = LoggerFactory.getLogger(StartupDiagnostics.class);

    private final Environment env;
    private final Optional<BuildProperties> buildProperties;

    public StartupDiagnostics(Environment env, Optional<BuildProperties> buildProperties) {
        this.env = env;
        this.buildProperties = buildProperties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logStats() {
        log.info("========== APPLICATION STARTUP DIAGNOSTICS ==========");

        logAppInfo();
        logJvmInfo();
        logGcInfo();
        logCpuAndContainerLimits();
        logThreadInfo();
        logDiskInfo();
        logEnvHints();

        log.info("=====================================================");
    }

    private void logAppInfo() {
        log.info("--- Application / Spring ---");
        buildProperties.ifPresentOrElse(bp -> {
            log.info("App name:    {}", bp.getName());
            log.info("App version: {}", bp.getVersion());
            log.info("Build time:  {}", bp.getTime());
        }, () -> log.info("BuildProperties not available (no build-info.properties)"));

        log.info("Active profiles: {}", Arrays.toString(env.getActiveProfiles()));
        log.info("Server port:     {}", env.getProperty("server.port", "default/unknown"));

        try {
            String hostname = InetAddress.getLocalHost().getHostName();
            String hostAddr = InetAddress.getLocalHost().getHostAddress();
            log.info("Host: {} ({})", hostname, hostAddr);
        } catch (Exception e) {
            log.info("Host: <unresolved> ({})", e.toString());
        }

        log.info("Time zone: {}", ZoneId.systemDefault());
    }

    private void logJvmInfo() {
        log.info("--- JVM / Memory ---");

        RuntimeMXBean runtime = ManagementFactory.getRuntimeMXBean();
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();

        long uptimeMs = runtime.getUptime();
        Instant startTime = Instant.ofEpochMilli(runtime.getStartTime());

        log.info("Java version: {} ({})", System.getProperty("java.version"), System.getProperty("java.vendor"));
        log.info("JVM: {} {}", runtime.getVmName(), runtime.getVmVersion());
        log.info("PID (if available): {}", runtime.getName());
        log.info("Start time: {}", DateTimeFormatter.ISO_OFFSET_DATE_TIME
                .withZone(ZoneId.systemDefault())
                .format(startTime));
        log.info("Uptime: {} seconds", uptimeMs / 1000);

        long max = Runtime.getRuntime().maxMemory();
        long total = Runtime.getRuntime().totalMemory();
        long free = Runtime.getRuntime().freeMemory();
        long used = total - free;

        log.info("Heap (max):      {} MB", max / 1024 / 1024);
        log.info("Heap (total):    {} MB", total / 1024 / 1024);
        log.info("Heap (used):     {} MB", used / 1024 / 1024);
        log.info("Heap (free):     {} MB", free / 1024 / 1024);

        MemoryUsage heap = memory.getHeapMemoryUsage();
        MemoryUsage nonHeap = memory.getNonHeapMemoryUsage();
        log.info("Heap usage (detailed): used={} MB, committed={} MB, max={} MB",
                heap.getUsed() / 1024 / 1024,
                heap.getCommitted() / 1024 / 1024,
                heap.getMax() / 1024 / 1024);
        log.info("Non-heap usage: used={} MB, committed={} MB, max={} MB",
                nonHeap.getUsed() / 1024 / 1024,
                nonHeap.getCommitted() / 1024 / 1024,
                nonHeap.getMax() / 1024 / 1024);

        log.info("JVM args: {}", runtime.getInputArguments());
    }

    private void logGcInfo() {
        log.info("--- Garbage Collectors ---");
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            log.info("GC: {} – collections: {}, time(ms): {}, pools: {}",
                    gc.getName(),
                    gc.getCollectionCount(),
                    gc.getCollectionTime(),
                    Arrays.toString(gc.getMemoryPoolNames()));
        }
    }

    private void logCpuAndContainerLimits() {
        log.info("--- CPU / Container limits ---");

        OperatingSystemMXBean osBase = ManagementFactory.getOperatingSystemMXBean();
        log.info("OS: {} {} ({})", osBase.getName(), osBase.getVersion(), osBase.getArch());
        log.info("JVM visible CPU cores: {}", osBase.getAvailableProcessors());
        log.info("System load average: {}", osBase.getSystemLoadAverage());

        // Host physical memory (if available)
        try {
            if (osBase instanceof com.sun.management.OperatingSystemMXBean os) {
                long totalPhysical = os.getTotalPhysicalMemorySize();
                long freePhysical = os.getFreePhysicalMemorySize();
                long usedPhysical = totalPhysical - freePhysical;

                log.info("Host physical memory: total={} MB, used={} MB, free={} MB",
                        totalPhysical / 1024 / 1024,
                        usedPhysical / 1024 / 1024,
                        freePhysical / 1024 / 1024);
            } else {
                log.info("Host physical memory: not available on this JVM implementation");
            }
        } catch (Exception e) {
            log.info("Error reading host physical memory: {}", e.toString());
        }

        // cgroup v1 memory limit
        try {
            Path limitFileV1 = Paths.get("/sys/fs/cgroup/memory/memory.limit_in_bytes");
            Path limitFileV2 = Paths.get("/sys/fs/cgroup/memory.max");

            if (Files.exists(limitFileV1)) {
                long limit = Long.parseLong(Files.readString(limitFileV1).trim());
                log.info("cgroup v1 memory limit: {} MB", limit / 1024 / 1024);
            } else if (Files.exists(limitFileV2)) {
                String txt = Files.readString(limitFileV2).trim();
                if (!"max".equals(txt)) {
                    long limit = Long.parseLong(txt);
                    log.info("cgroup v2 memory limit: {} MB", limit / 1024 / 1024);
                } else {
                    log.info("cgroup v2 memory limit: max (no explicit limit)");
                }
            } else {
                log.info("No cgroup memory limit detected");
            }
        } catch (Exception e) {
            log.info("Error reading cgroup memory limits: {}", e.toString());
        }

        // cgroup v1 CPU quota
        try {
            Path cpuQuotaV1 = Paths.get("/sys/fs/cgroup/cpu/cpu.cfs_quota_us");
            Path cpuPeriodV1 = Paths.get("/sys/fs/cgroup/cpu/cpu.cfs_period_us");
            Path cpuMaxV2 = Paths.get("/sys/fs/cgroup/cpu.max");

            if (Files.exists(cpuQuotaV1) && Files.exists(cpuPeriodV1)) {
                long quota = Long.parseLong(Files.readString(cpuQuotaV1).trim());
                long period = Long.parseLong(Files.readString(cpuPeriodV1).trim());
                if (quota > 0 && period > 0) {
                    double cores = (double) quota / (double) period;
                    log.info("cgroup v1 CPU limit: {} cores", cores);
                } else {
                    log.info("cgroup v1 CPU limit: unlimited");
                }
            } else if (Files.exists(cpuMaxV2)) {
                String[] parts = Files.readString(cpuMaxV2).trim().split(" ");
                if (parts.length >= 2 && !"max".equals(parts[0])) {
                    long quota = Long.parseLong(parts[0]);
                    long period = Long.parseLong(parts[1]);
                    double cores = (double) quota / (double) period;
                    log.info("cgroup v2 CPU limit: {} cores", cores);
                } else {
                    log.info("cgroup v2 CPU limit: max (no explicit limit)");
                }
            } else {
                log.info("No cgroup CPU limit detected");
            }
        } catch (Exception e) {
            log.info("Error reading cgroup CPU limits: {}", e.toString());
        }
    }

    private void logThreadInfo() {
        log.info("--- Threads ---");
        ThreadMXBean threads = ManagementFactory.getThreadMXBean();
        log.info("Live threads: {}", threads.getThreadCount());
        log.info("Peak threads: {}", threads.getPeakThreadCount());
        log.info("Daemon threads: {}", threads.getDaemonThreadCount());
    }

    private void logDiskInfo() {
        log.info("--- Disk / FS ---");
        File cwd = new File(".");
        long total = cwd.getTotalSpace();
        long free = cwd.getUsableSpace();
        log.info("Working directory: {}", cwd.getAbsolutePath());
        log.info("Disk total space:  {} GB", total / 1024 / 1024 / 1024);
        log.info("Disk free space:   {} GB", free / 1024 / 1024 / 1024);

        String tmpDir = System.getProperty("java.io.tmpdir");
        log.info("Temp directory: {}", tmpDir);
    }

    private void logEnvHints() {
        log.info("--- Environment (selected, non-secret) ---");
        Map<String, String> env = System.getenv();

        // Typical for containers
        logIfPresent(env, "HOSTNAME");
        logIfPresent(env, "K_SERVICE");   // Cloud Run
        logIfPresent(env, "K_REVISION");
        logIfPresent(env, "K_CONFIGURATION");
        logIfPresent(env, "AWS_LAMBDA_FUNCTION_NAME");
        logIfPresent(env, "AWS_LAMBDA_FUNCTION_MEMORY_SIZE");
        logIfPresent(env, "AWS_REGION");
        logIfPresent(env, "FUNCTION_TARGET"); // GCP functions
        logIfPresent(env, "PORT");            // some platforms override server.port

        // Just to see if debug flags are set
        logIfPresent(env, "JAVA_TOOL_OPTIONS");
        logIfPresent(env, "JAVA_OPTS");
    }

    private void logIfPresent(Map<String, String> env, String key) {
        if (env.containsKey(key)) {
            log.info("ENV {}={}", key, env.get(key));
        }
    }
}
