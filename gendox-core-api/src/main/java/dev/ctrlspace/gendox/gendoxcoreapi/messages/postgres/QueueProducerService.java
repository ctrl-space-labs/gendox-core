package dev.ctrlspace.gendox.gendoxcoreapi.messages.postgres;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QueueMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.QueueMessageRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class QueueProducerService {

    private final QueueMessageRepository repo;
    private final ObjectMapper mapper;

    public QueueProducerService(QueueMessageRepository repo, ObjectMapper objectMapper) {
        this.repo = repo;
        this.mapper = objectMapper;
    }

    @Transactional
    public UUID send(String topic, JsonNode payload, Map<String, String> headers) {
        ObjectNode hdrs = mapper.createObjectNode();
        if (headers != null) headers.forEach(hdrs::put);

        QueueMessage m = new QueueMessage();
        m.setTopic(topic);
        m.setPayload(payload);
        m.setHeaders(hdrs);
        m.setStatus(QueueMessage.Status.NEW);

        QueueMessage saved = repo.save(m);
        return saved.getMessageId();
    }

    @Transactional
    public UUID convertAndSend(String topic, Object payloadPojo, Map<String, String> headers) {
        return send(topic, mapper.valueToTree(payloadPojo), headers);
    }
}
