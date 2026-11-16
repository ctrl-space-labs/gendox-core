package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ArtifactShareConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactShare;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.ProjectOrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareReaderViewDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactShareCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactShareService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ArtifactShareControllerTest {

    private final UUID me = UUID.randomUUID();
    private final UUID organizationId = UUID.randomUUID();
    private final UUID myProject = UUID.randomUUID();
    private final UUID projectOfAnotherOrganization = UUID.randomUUID();
    private final UUID sharer = UUID.randomUUID();

    private ArtifactShareService artifactShareService;
    private ArtifactShareController controller;
    private Authentication signedIn;

    @BeforeEach
    void setUp() {
        artifactShareService = mock(ArtifactShareService.class);
        controller = new ArtifactShareController(artifactShareService, mock(ArtifactService.class),
                new ArtifactShareConverter(), mock(SecurityUtils.class));

        UserProfile profile = UserProfile.builder().id(me.toString()).organizations(List.of(
                OrganizationUserDTO.builder().id(organizationId.toString())
                        .projects(List.of(ProjectOrganizationDTO.builder().id(myProject.toString()).build())).build(),
                OrganizationUserDTO.builder().id(UUID.randomUUID().toString())
                        .projects(List.of(ProjectOrganizationDTO.builder().id(projectOfAnotherOrganization.toString()).build())).build()
        )).build();
        signedIn = new UsernamePasswordAuthenticationToken(profile, null, List.of());

        Artifact artifact = Artifact.builder().id(UUID.randomUUID()).threadId(UUID.randomUUID()).projectId(myProject)
                .title("Returns policy").artifactType(Type.builder().name("HTML").build()).latestVersion(2)
                .updatedAt(Instant.parse("2026-11-16T10:00:00Z")).build();
        ArtifactShare share = ArtifactShare.builder().id(UUID.randomUUID()).artifact(artifact)
                .audienceType(Type.builder().name("PROJECT").build()).createdBy(sharer)
                .createdAt(Instant.parse("2026-11-16T11:00:00Z")).build();
        when(artifactShareService.getSharedWith(any(), any())).thenReturn(new PageImpl<>(List.of(share)));
        User user = new User();
        user.setId(sharer);
        user.setName("Maria Papadopoulou");
        user.setEmail("maria@example.com");
        when(artifactShareService.usersById(any())).thenReturn(Map.of(sharer, user));
    }

    @Test
    void theListIsTheSignedInReadersWhateverTheRequestSays() throws GendoxException {
        ArtifactShareCriteria fromRequest = ArtifactShareCriteria.builder()
                .readerId(UUID.randomUUID()).organizationId(UUID.randomUUID())
                .readerProjectIds(List.of(UUID.randomUUID())).search("policy").build();

        controller.getSharedWithMe(organizationId, null, fromRequest, PageRequest.of(0, 20), signedIn);

        ArgumentCaptor<ArtifactShareCriteria> used = ArgumentCaptor.forClass(ArtifactShareCriteria.class);
        verify(artifactShareService).getSharedWith(used.capture(), any());
        assertEquals(me, used.getValue().getReaderId());
        assertEquals(organizationId, used.getValue().getOrganizationId());
        // only the reader's projects in this organization
        assertEquals(List.of(myProject), used.getValue().getReaderProjectIds());
        assertNull(used.getValue().getProjectId());
        assertEquals("policy", used.getValue().getSearch());
    }

    @Test
    void anAgentsListNarrowsToItsProject() throws GendoxException {
        controller.getSharedWithMe(organizationId, myProject, new ArtifactShareCriteria(), PageRequest.of(0, 20), signedIn);

        ArgumentCaptor<ArtifactShareCriteria> used = ArgumentCaptor.forClass(ArtifactShareCriteria.class);
        verify(artifactShareService).getSharedWith(used.capture(), any());
        assertEquals(myProject, used.getValue().getProjectId());
    }

    @Test
    void eachRowNamesWhoSharedItAndHasNoContentOrConversation() throws GendoxException {
        Page<ArtifactShareReaderViewDTO> page =
                controller.getSharedWithMe(organizationId, null, new ArtifactShareCriteria(), PageRequest.of(0, 20), signedIn);

        ArtifactShareReaderViewDTO row = page.getContent().getFirst();
        assertEquals("Returns policy", row.getTitle());
        assertEquals("Maria Papadopoulou", row.getSharedByName());
        assertEquals(2, row.getVersion());
        assertTrue(row.getFollowsLatest());
        assertNull(row.getContent());
        assertEquals(organizationId, row.getOrganizationId());
    }

    @Test
    void newestFirstAndAtMostAHundredAPage() throws GendoxException {
        controller.getSharedWithMe(organizationId, null, new ArtifactShareCriteria(), PageRequest.of(0, 20), signedIn);

        ArgumentCaptor<Pageable> used = ArgumentCaptor.forClass(Pageable.class);
        verify(artifactShareService).getSharedWith(any(), used.capture());
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), used.getValue().getSort());

        GendoxException e = assertThrows(GendoxException.class, () -> controller.getSharedWithMe(
                organizationId, null, new ArtifactShareCriteria(), PageRequest.of(0, 101), signedIn));
        assertEquals("MAX_PAGE_SIZE_EXCEED", e.getErrorCode());
    }
}
