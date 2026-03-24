package dev.ctrlspace.gendox.gendoxcoreapi.controller;


import dev.ctrlspace.gendox.gendoxcoreapi.converters.EOScriptConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.EOTaskGeometryConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.EOScript;
import dev.ctrlspace.gendox.gendoxcoreapi.model.EOTaskGeometry;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EOScriptDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EOTaskGeometryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EOScriptService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EOTaskGeometryService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/organizations/{organizationId}/projects/{projectId}/tasks/{taskId}/earth-observation")
public class EarthObservationController {
    Logger logger = LoggerFactory.getLogger(EarthObservationController.class);

    private final EOScriptService eoScriptService;
    private final EOScriptConverter eoScriptConverter;
    private final EOTaskGeometryService eoTaskGeometryService;
    private final EOTaskGeometryConverter eoTaskGeometryConverter;
    private final TaskService taskService;

    @Autowired
    public EarthObservationController(EOScriptService eoScriptService,
                                      EOScriptConverter eoScriptConverter,
                                      EOTaskGeometryService eoTaskGeometryService,
                                      EOTaskGeometryConverter eoTaskGeometryConverter,
                                      TaskService taskService) {
        this.eoScriptService = eoScriptService;
        this.eoScriptConverter = eoScriptConverter;
        this.eoTaskGeometryService = eoTaskGeometryService;
        this.eoTaskGeometryConverter = eoTaskGeometryConverter;
        this.taskService = taskService;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(
            value = "/eo-scripts",
            produces = {"application/json"}
    )
    @ResponseStatus(HttpStatus.CREATED)
    public EOScript createEOScript(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @RequestBody EOScriptDTO eoScriptDTO
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException(
                    "INVALID_PROJECT",
                    "Task does not belong to the specified project",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Force taskId from path (not from client)
        eoScriptDTO.setTaskId(taskId);
        eoScriptDTO.setIsLatestVersion(null); // defensive: service decides this

        EOScript eoScript = eoScriptConverter.toEntity(eoScriptDTO);

        return eoScriptService.createNewEOScript(eoScript);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(
            value = "/eo-scripts",
            produces = {"application/json"}
    )
    public List<EOScript> getEOScripts(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException(
                    "INVALID_PROJECT",
                    "Task does not belong to the specified project",
                    HttpStatus.BAD_REQUEST
            );
        }

        return eoScriptService.getEOScriptsByTaskId(taskId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(
            value = "/eo-scripts/latest",
            produces = {"application/json"}
    )
    public EOScript getLatestEOScript(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException(
                    "INVALID_PROJECT",
                    "Task does not belong to the specified project",
                    HttpStatus.BAD_REQUEST
            );
        }

        EOScript latest = eoScriptService.getLatestEOScript(taskId);
        if (latest == null) {
            throw new GendoxException(
                    "EO_SCRIPT_NOT_FOUND",
                    "No EO Script found for the specified task",
                    HttpStatus.NOT_FOUND
            );
        }

        return latest;
    }



    // ─── EOTaskGeometry endpoints ───────────────────────────────────────────────

    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(
            value = "/eo-geometries",
            produces = {"application/json"}
    )
    public List<EOTaskGeometryDTO> getGeometries(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }

        return eoTaskGeometryService.getGeometriesByTaskId(taskId)
                .stream()
                .map(eoTaskGeometryConverter::toDTO)
                .toList();
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(
            value = "/eo-geometries",
            produces = {"application/json"}
    )
    @ResponseStatus(HttpStatus.CREATED)
    public EOTaskGeometryDTO createGeometry(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @RequestBody EOTaskGeometryDTO dto
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }

        dto.setTaskId(taskId);
        EOTaskGeometry entity = eoTaskGeometryConverter.toEntity(dto);
        EOTaskGeometry saved = eoTaskGeometryService.createGeometry(entity);
        return eoTaskGeometryConverter.toDTO(saved);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @PutMapping(
            value = "/eo-geometries/{geometryId}",
            produces = {"application/json"}
    )
    public EOTaskGeometryDTO updateGeometry(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @PathVariable UUID geometryId,
            @RequestBody EOTaskGeometryDTO dto
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }

        dto.setId(geometryId);
        dto.setTaskId(taskId);
        EOTaskGeometry entity = eoTaskGeometryConverter.toEntity(dto);
        EOTaskGeometry updated = eoTaskGeometryService.updateGeometry(entity);
        return eoTaskGeometryConverter.toDTO(updated);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping(
            value = "/eo-geometries/{geometryId}",
            produces = {"application/json"}
    )
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGeometry(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @PathVariable UUID geometryId
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }

        eoTaskGeometryService.deleteGeometry(geometryId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping(
            value = "/eo-geometries",
            produces = {"application/json"}
    )
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAllGeometries(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) throws GendoxException {

        Task task = taskService.getTaskById(taskId);
        if (task.getProjectId() == null || !task.getProjectId().equals(projectId)) {
            throw new GendoxException("INVALID_PROJECT", "Task does not belong to the specified project", HttpStatus.BAD_REQUEST);
        }

        eoTaskGeometryService.deleteAllByTaskId(taskId);
    }

}
