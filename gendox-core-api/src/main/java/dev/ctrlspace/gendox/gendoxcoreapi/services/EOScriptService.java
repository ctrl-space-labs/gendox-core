package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EOScript;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EOScriptRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EOScriptService {

    private static final Logger logger = LoggerFactory.getLogger(EOScriptService.class);
    private final EOScriptRepository eoScriptRepository;


    @Autowired
    public EOScriptService(EOScriptRepository eoScriptRepository) {
        this.eoScriptRepository = eoScriptRepository;
    }



    public List<EOScript> getEOScriptsByTaskId(UUID taskId) {
        logger.info("Fetching EOScripts for task id: {}", taskId);
        return eoScriptRepository.findByTask_IdOrderByCreatedAtDesc(taskId);
    }

    public EOScript getLatestEOScript(UUID taskId) {
        return eoScriptRepository
                .findFirstByTask_IdOrderByCreatedAtDesc(taskId)
                .orElse(null);
    }

@Transactional
    public EOScript createNewEOScript(EOScript eoScript) {
        UUID taskId = eoScript.getTask().getId();

        // 1️⃣ Mark all previous scripts as NOT latest
        eoScriptRepository.markAllAsNotLatest(taskId);

        // 2️⃣ Mark the new one as latest
        eoScript.setLatestVersion(true);

        // 3️⃣ Save
        return eoScriptRepository.save(eoScript);
    }







}
