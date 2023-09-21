package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectMemberCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectMemberPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.RoleNamesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectMemberService {

    private ProjectMemberRepository projectMemberRepository;
    private UserService userService;
    private ProjectService projectService;

    private UserOrganizationService userOrganizationService;

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    public ProjectMemberService(ProjectMemberRepository projectMemberRepository,
                                @Lazy UserService userService,
                                @Lazy ProjectService projectService,
                                UserOrganizationService userOrganizationService) {
        this.projectMemberRepository = projectMemberRepository;
        this.userService = userService;
        this.projectService = projectService;
        this.userOrganizationService = userOrganizationService;
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


    public ProjectMember createProjectMember(ProjectMember projectMember) throws Exception {
        Instant now = Instant.now();

        // Check if the user is already a member of the project
        if (projectMemberRepository.findByProjectIdAndUserId(projectMember.getProject().getId(), projectMember.getUser().getId()) != null) {
            throw new GendoxException("DUPLICATE_PROJECT_MEMBER", "User is already a member of this project ", HttpStatus.BAD_REQUEST);
        }


        if (projectMember.getId() != null) {
            throw new GendoxException("NEW_MEMBER_PROJECT_ID_IS_NOT_NULL", "Member-Project id must be null", HttpStatus.BAD_REQUEST);
        }

        projectMember.setCreatedAt(now);
        projectMember.setUpdatedAt(now);

        projectMember = projectMemberRepository.save(projectMember);

        return projectMember;


    }

    public ProjectMember createProjectMember(UUID userId, UUID projectId) throws Exception {
        Instant now = Instant.now();


        User user = userService.getById(userId);
        Project project = projectService.getProjectById(projectId);

        ProjectMember projectMember = new ProjectMember();
        projectMember.setUser(user);
        projectMember.setProject(project);
        projectMember.setCreatedAt(now);
        projectMember.setUpdatedAt(now);

        return this.createProjectMember(projectMember);

    }

    public List<ProjectMember> createAllProjectMembers(Set<UUID> userIds, UUID projectId) throws Exception {
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


    public void setMemberRoleForTheCreator(Project project) throws Exception {
        // user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());

        createProjectMember(UUID.fromString(jwtDTO.getUserId()), project.getId());

    }

    /**
     * Add the default members to the project
     * The default members are the project's creator and the organization's admins
     *
     * @param project
     * @param organizationId
     * @throws Exception
     */
    public void addDefaultMembersToTheProject(Project project, UUID organizationId) throws Exception {
        // user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());

        // The project's creator become member of the project
        createProjectMember(UUID.fromString(jwtDTO.getUserId()), project.getId());

        // project's users
        Set<UUID> userIds = userOrganizationService.getAll(UserOrganizationCriteria
                        .builder()
                        .organizationId(organizationId.toString())
                        .roleName(RoleNamesConstants.ADMIN)
                        .build())
                .stream()
                .map(userOrganization -> userOrganization.getUser().getId())
                .collect(Collectors.toSet());

        userIds.add(UUID.fromString(jwtDTO.getUserId()));

        createAllProjectMembers(userIds, project.getId());


    }


    public void deleteAllProjectMembers(UUID id) throws Exception {
        ProjectMember projectMember = projectMemberRepository.findById(id).orElse(null);

        if (projectMember != null) {
            projectMemberRepository.deleteById(id);
        } else {
            throw new GendoxException("PROJECT_MEMBER_NOT_FOUND", "Project - Member not found with id: " + id, HttpStatus.NOT_FOUND);

        }


    }

    public void deleteAllProjectMembers(Project project) throws Exception {
        List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(project.getId());

        for (int i = 0; i < projectMembers.size(); i++) {
            projectMemberRepository.delete(projectMembers.get(i));
        }

    }


    public void removeMemberFromProject(UUID projectId, UUID userId) throws Exception {
        User user = userService.getById(userId);
        Project project = projectService.getProjectById(projectId);

        ProjectMember projectMember = projectMemberRepository.findByProjectIdAndUserId(projectId, userId);

        if (projectMember != null) {
            projectMemberRepository.deleteById(projectMember.getId());
        } else {
            throw new GendoxException("PROJECT_MEMBER_NOT_FOUND", "Project not found with id: " + projectId + " or user with id: " + userId, HttpStatus.NOT_FOUND);
        }


    }

}
