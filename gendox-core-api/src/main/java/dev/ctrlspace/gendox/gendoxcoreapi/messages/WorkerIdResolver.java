package dev.ctrlspace.gendox.gendoxcoreapi.messages;

import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.util.UUID;

public final class WorkerIdResolver {
    private WorkerIdResolver() {}

    public static String resolve() {
        String host = firstNonBlank(
                System.getenv("HOSTNAME"),
                System.getenv("COMPUTERNAME"),
                safeHostName(),
                "local"
        );

        String pid = safePid(); // "12345" or "pid"
        String rand = UUID.randomUUID().toString().substring(0, 8);

        // Example: myhost-12345-a1b2c3d4
        return host + "-" + pid + "-" + rand;
    }

    private static String safeHostName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return null;
        }
    }

    private static String safePid() {
        // Java 9+: ProcessHandle
        try {
            return String.valueOf(ProcessHandle.current().pid());
        } catch (Exception ignored) {}

        // Fallback: "12345@hostname"
        try {
            String jvmName = ManagementFactory.getRuntimeMXBean().getName();
            int at = jvmName.indexOf('@');
            return at > 0 ? jvmName.substring(0, at) : jvmName;
        } catch (Exception e) {
            return "pid";
        }
    }

    private static String firstNonBlank(String... vals) {
        for (String v : vals) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }
}

