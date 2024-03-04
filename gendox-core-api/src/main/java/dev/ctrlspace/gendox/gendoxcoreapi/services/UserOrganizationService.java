package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.UserOrganizationPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
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
import java.util.List;
import java.util.UUID;


@Service
public class UserOrganizationService {

    private UserOrganizationRepository userOrganizationRepository;
    private UserService userService;
    private OrganizationService organizationService;
    private TypeService typeService;
    private UserRepository userRepository;

    @Autowired
    private JWTUtils jwtUtils;
    private final OrganizationRepository organizationRepository;

    @Autowired
    public UserOrganizationService(UserOrganizationRepository userOrganizationRepository,
                                   TypeService typeRepository,
                                   @Lazy UserService userService,
                                   @Lazy OrganizationService organizationService,
                                   UserRepository userRepository,
                                   OrganizationRepository organizationRepository) {
        this.userOrganizationRepository = userOrganizationRepository;
        this.typeService = typeRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.organizationService = organizationService;

        this.organizationRepository = organizationRepository;
    }

    public List<UserOrganization> getUserOrganizationByOrganizationId(UUID organizationId) throws GendoxException {
        return userOrganizationRepository.findByOrganizationId(organizationId);
    }

    public List<UserOrganization> getAll(UserOrganizationCriteria criteria) throws GendoxException {
        Pageable pageable = PageRequest.of(0, 100);
        return getAll(criteria, pageable);
    }

    public List<UserOrganization> getAll(UserOrganizationCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return userOrganizationRepository.findAll(UserOrganizationPredicate.build(criteria), pageable).toList();

    }

    public boolean isUserOrganizationMember(UUID userId, UUID organizationID){
        return userOrganizationRepository.existsByUserIdAndOrganizationId(userId, organizationID);
    }

    public UserOrganization createUserOrganization(UUID userId, UUID organizationId, String roleName) throws GendoxException {

        User user = userService.getById(userId);
        Organization organization = organizationService.getById(organizationId);
        Type role = typeService.getOrganizationRolesByName(roleName);

        UserOrganization userOrganization = new UserOrganization();
        userOrganization.setUser(user);
        userOrganization.setOrganization(organization);
        userOrganization.setRole(role);

        return this.createUserOrganization(userOrganization);


    }

    public UserOrganization createUserOrganization(UserOrganization userOrganization) throws GendoxException {

        if (userOrganizationRepository.existsByUserAndOrganization(userOrganization.getUser(), userOrganization.getOrganization())) {
            throw new GendoxException("USER_ORGANIZATION_ALREADY_EXISTS", "User-organization combination already exists", HttpStatus.BAD_REQUEST);
        }

        if (userOrganization.getId() != null) {
            throw new GendoxException("NEW_USER_ORGANIZATION_ID_IS_NOT_NULL", "User Organization id must be null", HttpStatus.BAD_REQUEST);
        }

        userOrganization = userOrganizationRepository.save(userOrganization);

        return userOrganization;
    }

    public void deleteUserOrganization(UserOrganization userOrganization) throws GendoxException {
        userOrganizationRepository.delete(userOrganization);
    }

    public void setAdminRoleForOrganizationsOwner(Organization organization) throws GendoxException {
        // user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String userId = ((UserProfile) authentication.getPrincipal()).getId();

        createUserOrganization(UUID.fromString(userId), organization.getId(), "ROLE_ADMIN");

    }
}












