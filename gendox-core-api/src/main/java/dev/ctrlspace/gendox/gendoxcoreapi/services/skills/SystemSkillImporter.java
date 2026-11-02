package dev.ctrlspace.gendox.gendoxcoreapi.services.skills;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * On startup, imports the Gendox skills shipped in {@code classpath:skills/<name>/SKILL.md}
 * (see {@link SkillService#importSystemSkill}). Each file is its own transaction, so one bad file
 * cannot stop the others or the application.
 */
@Component
public class SystemSkillImporter {

    private static final Logger logger = LoggerFactory.getLogger(SystemSkillImporter.class);
    static final String LOCATION = "classpath*:skills/*/SKILL.md";

    private final SkillService skillService;

    public SystemSkillImporter(SkillService skillService) {
        this.skillService = skillService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void importSystemSkills() {
        try {
            for (Resource resource : new PathMatchingResourcePatternResolver().getResources(LOCATION)) {
                try {
                    skillService.importSystemSkill(resource.getContentAsString(StandardCharsets.UTF_8));
                } catch (Exception e) {
                    logger.error("Could not import the system skill {}", resource.getDescription(), e);
                }
            }
        } catch (Exception e) {
            logger.error("Could not list the system skills in {}", LOCATION, e);
        }
    }
}
