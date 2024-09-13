package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectMemberCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectMemberPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.OrganizationRolesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectMemberService {

    private ProjectMemberRepository projectMemberRepository;
    private UserService userService;
    private ProjectService projectService;

    private UserOrganizationService userOrganizationService;
    private final ProjectRepository projectRepository;

    @Autowired
    public ProjectMemberService(ProjectMemberRepository projectMemberRepository,
                                @Lazy UserService userService,
                                @Lazy ProjectService projectService,
                                UserOrganizationService userOrganizationService,
                                ProjectRepository projectRepository) {
        this.projectMemberRepository = projectMemberRepository;
        this.userService = userService;
        this.projectService = projectService;
        this.userOrganizationService = userOrganizationService;
        this.projectRepository = projectRepository;
    }

    public List<ProjectMember> getAll(ProjectMemberCriteria criteria) throws GendoxException {
        Pageable pageable = PageRequest.of(0, 100);
        return getAll(criteria, pageable);
    }

    public List<ProjectMember> getAll(ProjectMemberCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return projectMemberRepository.findAll(ProjectMemberPredicates.build(criteria), pageable).toList();
    }

    public boolean isUserProjectMember(UUID userId, UUID projectId) {
        return projectMemberRepository.existsByProjectIdAndUserId(projectId, userId);
    }


    public ProjectMember createProjectMember(ProjectMember projectMember) throws GendoxException {

        // Check if the user is already a member of the project
        if (projectMemberRepository.findByProjectIdAndUserId(projectMember.getProject().getId(), projectMember.getUser().getId()) != null) {
            return projectMember;
        }

        if (projectMember.getId() != null) {
            throw new GendoxException("NEW_MEMBER_PROJECT_ID_IS_NOT_NULL", "Member-Project id must be null", HttpStatus.BAD_REQUEST);
        }

        projectMember = projectMemberRepository.save(projectMember);
        return projectMember;
    }


    public ProjectMember createProjectMember(UUID userId, UUID projectId) throws GendoxException {

        ProjectMember projectMember = new ProjectMember();
        projectMember.setUser(new User());
        projectMember.getUser().setId(userId);
        projectMember.setProject(new Project());
        projectMember.getProject().setId(projectId);

        return this.createProjectMember(projectMember);

    }

    public List<ProjectMember> createProjectMembers(UUID projectId, List<UUID> userIds) throws GendoxException {

        List<ProjectMember> projectMembers = new ArrayList<>();
        Project project = projectService.getProjectById(projectId);


        for (UUID userId : userIds) {
            ProjectMember projectMember = new ProjectMember();
            User user = userService.getById(userId);
            projectMember.setUser(user);
            projectMember.setProject(project);
            projectMembers.add(projectMember);
        }


        if (!projectMembers.isEmpty()) {
            projectMembers = projectMemberRepository.saveAll(projectMembers);
        }

        return projectMembers;

    }

    public List<ProjectMember> createAllProjectMembers(Set<UUID> userIds, UUID projectId) throws GendoxException {
        List<ProjectMember> projectMembers = new ArrayList<>();
        for (UUID userId : userIds) {
            projectMembers.add(
                    createProjectMember(userId, projectId));
        }
        return projectMembers;

//        Alternative of the above code
//        Stream.concat(userOrganizations.stream(), creator.stream())
//                .map(userOrganization -> userOrganization.getUser().getId())
//                .forEach(userId -> {
//                    try {
//                        createProjectMember(userId, project.getId());
//                    } catch (Exception e) {
//                        throw new RuntimeException(e);
//                    }
//                });
    }


    public void setMemberRoleForTheCreator(Project project) throws GendoxException {
        // user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = ((UserProfile) authentication.getPrincipal()).getId();

        createProjectMember(UUID.fromString(userId), project.getId());

    }

    /**
     * Add the default members to the project
     * The default members are the project's creator and the organization's admins
     *
     * @param project the project to add the default members to
     * @param organizationId the organization id where the project belongs and all the admins will be members
     * @param creatorUserId the creator of the project to be added as a member
     * @throws Exception
     */
    public void addDefaultMembersToTheProject(Project project, UUID organizationId, String creatorUserId) throws GendoxException {

        // project's users all the organization admins
        Set<UUID> userIds = userOrganizationService.getAll(UserOrganizationCriteria
                        .builder()
                        .organizationId(organizationId.toString())
                        .roleName(OrganizationRolesConstants.ADMIN)
                        .build())
                .stream()
                .map(userOrganization -> userOrganization.getUser().getId())
                .collect(Collectors.toSet());

        userIds.add(UUID.fromString(creatorUserId));

        createAllProjectMembers(userIds, project.getId());

    }


    public void deleteAllProjectMembers(UUID id) throws GendoxException {
        ProjectMember projectMember = projectMemberRepository.findById(id).orElse(null);

        if (projectMember != null) {
            projectMemberRepository.deleteById(id);
        } else {
            throw new GendoxException("PROJECT_MEMBER_NOT_FOUND", "Project - Member not found with id: " + id, HttpStatus.NOT_FOUND);

        }


    }

    public void deleteAllProjectMembers(Project project) throws GendoxException {
        List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(project.getId());

        for (int i = 0; i < projectMembers.size(); i++) {
            projectMemberRepository.delete(projectMembers.get(i));
        }

    }


    public void removeMemberFromProject(UUID projectId, UUID userId) throws GendoxException {


        ProjectMember projectMember = projectMemberRepository.findByProjectIdAndUserId(projectId, userId);

        if (projectMember != null) {
            projectMemberRepository.deleteById(projectMember.getId());
        } else {
            throw new GendoxException("PROJECT_MEMBER_NOT_FOUND", "Project not found with id: " + projectId + " or user with id: " + userId, HttpStatus.NOT_FOUND);
        }


    }

    public List<ProjectMember> getProjectMembersByProjectId(UUID projectId) {
        return projectMemberRepository.findByProjectId(projectId);
    }


}
