package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import com.sun.net.httpserver.HttpServer;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.net.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OkHttpCompatibilityTest {

    @Test
    void sdkAndTelemetryClientsShareCompatibleSocketLibraries() throws Exception {
        // Different artifact names can otherwise hide duplicate classes from Maven's conflict resolution.
        ClassLoader loader = getClass().getClassLoader();
        assertEquals(1, Collections.list(loader.getResources("okhttp3/OkHttpClient.class")).size());
        assertEquals(1, Collections.list(loader.getResources("okio/Okio.class")).size());

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            byte[] body = "ok".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            try (var output = exchange.getResponseBody()) {
                output.write(body);
            }
        });
        OkHttpClient client = new OkHttpClient.Builder()
                .proxy(Proxy.NO_PROXY)
                .callTimeout(5, TimeUnit.SECONDS)
                .addInterceptor(new HttpLoggingInterceptor(message -> {}).setLevel(HttpLoggingInterceptor.Level.BASIC))
                .build();
        server.start();
        try (var response = client.newCall(new Request.Builder()
                .url("http://127.0.0.1:" + server.getAddress().getPort() + "/").build()).execute()) {
            assertEquals(200, response.code());
            assertEquals("ok", response.body().string());
        } finally {
            server.stop(0);
            client.connectionPool().evictAll();
            client.dispatcher().executorService().shutdown();
        }
    }
}
