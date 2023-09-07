package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.RoleNamesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

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


    public ProjectMember createProjectMember(ProjectMember projectMember) throws Exception {
        Instant now = Instant.now();

        // TODO check if the Project's Member exist

        if (projectMember.getId() != null) {
            throw new GendoxException("NEW_USER_ORGANIZATION_ID_IS_NOT_NULL", "User Organization id must be null", HttpStatus.BAD_REQUEST);
        }

        projectMember.setCreatedAt(now);
        projectMember.setUpdatedAt(now);

        projectMember = projectMemberRepository.save(projectMember);

        return projectMember;


    }

    public ProjectMember createProjectMember(UUID userId, UUID projectId) throws Exception {
        Instant now = Instant.now();


        User user = userService.getById(userId);
        Project project = projectService.getById(projectId);

        ProjectMember projectMember = new ProjectMember();
        projectMember.setUser(user);
        projectMember.setProject(project);
        projectMember.setCreatedAt(now);
        projectMember.setUpdatedAt(now);

        return this.createProjectMember(projectMember);

    }


    public void setMemberRoleForTheCreator(Project project) throws Exception {
        // user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());

        createProjectMember(UUID.fromString(jwtDTO.getUserId()), project.getId());

    }

    public void setMemberRoleToProjects(Project project, UUID organizationId) throws Exception {
        // user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());

        // The project's creator become member of the project
        createProjectMember(UUID.fromString(jwtDTO.getUserId()), project.getId());

        // project's users
        List<UserOrganization> userOrganizations = userOrganizationService.getAll(UserOrganizationCriteria
                .builder()
                .organizationId(organizationId.toString())
                .build());

        for (int i = 0; i < userOrganizations.size(); i++) {
            if (userOrganizations.get(i).getRole().getName().equals(RoleNamesConstants.ADMIN)
                    && !userOrganizations.get(i).getUser().getId().equals(UUID.fromString(jwtDTO.getUserId()))) {
                // Project's Admin become member of the project
                createProjectMember(userOrganizations.get(i).getUser().getId(), project.getId());
            }
        }

    }


    public void deleteProjectMember(UUID id) throws Exception {
        ProjectMember projectMember = projectMemberRepository.findById(id).orElse(null);

        if (projectMember != null) {
            projectMemberRepository.deleteById(id);
        } else {
            throw new GendoxException("PROJECT_MEMBER_NOT_FOUND", "Project - Member not found with id: " + id, HttpStatus.NOT_FOUND);

        }


    }

    public void deleteProjectMember(Project project) throws Exception {
        List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(project.getId());

        for (int i = 0; i < projectMembers.size(); i++) {
            projectMemberRepository.delete(projectMembers.get(i));
        }


    }
}
