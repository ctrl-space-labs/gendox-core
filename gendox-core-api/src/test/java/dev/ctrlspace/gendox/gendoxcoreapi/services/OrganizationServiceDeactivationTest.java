package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceDeactivationTest {

    @InjectMocks
    private OrganizationService organizationService;

    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private UserOrganizationService userOrganizationService;
    @Mock
    private OrganizationDidService organizationDidService;
    @Mock
    private WalletKeyService walletKeyService;
    @Mock
    private TypeService typeService;
    @Mock
    private ProjectService projectService;
    @Mock
    private AuditLogsService auditLogsService;

    private static List<Project> projects(int count) {
        return IntStream.range(0, count).mapToObj(i -> {
            Project project = new Project();
            project.setId(UUID.randomUUID());
            return project;
        }).toList();
    }

    @Test
    void deletingAnOrganizationDeactivatesEveryAgent_notOnlyTheFirstPage() throws GendoxException {
        UUID organizationId = UUID.randomUUID();
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(new Organization()));
        when(auditLogsService.createDefaultAuditLogs(any())).thenReturn(new AuditLogs());
        // 230 agents: two full pages of 100 and one of 30
        when(projectService.getAllProjects(any(ProjectCriteria.class), eq(PageRequest.of(0, 100))))
                .thenReturn(new PageImpl<>(projects(100), PageRequest.of(0, 100), 230));
        when(projectService.getAllProjects(any(ProjectCriteria.class), eq(PageRequest.of(1, 100))))
                .thenReturn(new PageImpl<>(projects(100), PageRequest.of(1, 100), 230));
        when(projectService.getAllProjects(any(ProjectCriteria.class), eq(PageRequest.of(2, 100))))
                .thenReturn(new PageImpl<>(projects(30), PageRequest.of(2, 100), 230));

        organizationService.deactivateOrganization(organizationId);

        verify(projectService, times(230)).deactivateProject(any());
    }
}
