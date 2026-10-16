package dev.ctrlspace.gendox.gendoxcoreapi.services.chat;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.BiConsumer;

/** Delivery failures detach the browser, never the provider or persistence work. */
public final class ChatEventStream implements BiConsumer<String, Object> {
    private static final ScheduledExecutorService HEARTBEATS = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "chat-sse-heartbeats"); t.setDaemon(true); return t;
    });
    private final SseEmitter emitter = new SseEmitter(600_000L);
    private final AtomicBoolean detached = new AtomicBoolean();
    private final ScheduledFuture<?> heartbeat;
    public ChatEventStream() {
        heartbeat = HEARTBEATS.scheduleAtFixedRate(() -> {
            try { if (!detached.get()) emitter.send(SseEmitter.event().comment("keepalive")); }
            catch (Exception e) { detach(); }
        }, 15, 15, TimeUnit.SECONDS);
        emitter.onCompletion(this::detach);
        emitter.onTimeout(this::detach);
        emitter.onError(e -> detach());
    }
    public SseEmitter emitter() { return emitter; }
    @Override public synchronized void accept(String event, Object data) {
        if (detached.get()) return;
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
            if (event.equals("done") || event.equals("error") || event.equals("waiting_for_tools")) {
                detach(); emitter.complete();
            }
        } catch (Exception e) { detach(); }
    }
    public void detach() { detached.set(true); heartbeat.cancel(false); }
}
