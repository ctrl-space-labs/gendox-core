package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.EOTaskGeometry;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EOTaskGeometryRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EOTaskGeometryService {

    private static final Logger logger = LoggerFactory.getLogger(EOTaskGeometryService.class);

    private final EOTaskGeometryRepository eoTaskGeometryRepository;

    @Autowired
    public EOTaskGeometryService(EOTaskGeometryRepository eoTaskGeometryRepository) {
        this.eoTaskGeometryRepository = eoTaskGeometryRepository;
    }

    public List<EOTaskGeometry> getGeometriesByTaskId(UUID taskId) {
        logger.info("Fetching EOTaskGeometries for taskId: {}", taskId);
        return eoTaskGeometryRepository.findByTaskIdOrderByDisplayOrderAsc(taskId);
    }

    @Transactional
    public EOTaskGeometry createGeometry(EOTaskGeometry geometry) {
        logger.info("Creating EOTaskGeometry for taskId: {}", geometry.getTaskId());
        return eoTaskGeometryRepository.save(geometry);
    }

    @Transactional
    public EOTaskGeometry updateGeometry(EOTaskGeometry geometry) throws GendoxException {
        logger.info("Updating EOTaskGeometry id: {}", geometry.getId());
        EOTaskGeometry existing = eoTaskGeometryRepository.findById(geometry.getId())
                .orElseThrow(() -> new GendoxException("EO_GEOMETRY_NOT_FOUND",
                        "EOTaskGeometry not found: " + geometry.getId(), HttpStatus.NOT_FOUND));

        // Update only mutable fields — preserve createdAt / createdBy
        existing.setGeometryType(geometry.getGeometryType());
        existing.setCoordinates(geometry.getCoordinates());
        existing.setDisplayOrder(geometry.getDisplayOrder());
        existing.setTitle(geometry.getTitle());

        return eoTaskGeometryRepository.save(existing);
    }

    @Transactional
    public void deleteGeometry(UUID id) {
        logger.info("Deleting EOTaskGeometry id: {}", id);
        eoTaskGeometryRepository.deleteById(id);
    }

    @Transactional
    public void deleteAllByTaskId(UUID taskId) {
        logger.info("Deleting all EOTaskGeometries for taskId: {}", taskId);
        List<EOTaskGeometry> geometries = eoTaskGeometryRepository.findByTaskIdOrderByDisplayOrderAsc(taskId);
        eoTaskGeometryRepository.deleteAll(geometries);
    }
}
