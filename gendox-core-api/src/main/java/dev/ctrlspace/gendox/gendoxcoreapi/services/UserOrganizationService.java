package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserOrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.UserOrganizationPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;


@Service
public class UserOrganizationService {

    private UserOrganizationRepository userOrganizationRepository;
    private UserService userService;
    private OrganizationService organizationService;
    private TypeService typeService;





    @Autowired
    public UserOrganizationService(UserOrganizationRepository userOrganizationRepository,
                                   TypeService typeRepository,
                                   @Lazy UserService userService,
                                   @Lazy OrganizationService organizationService
    ) {
        this.userOrganizationRepository = userOrganizationRepository;
        this.typeService = typeRepository;
        this.userService = userService;
        this.organizationService = organizationService;
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

    public List<UserOrganization> getUserOrganizationsByUserId(String userId) {
        return userOrganizationRepository.findByUserId(UUID.fromString(userId));
    }

    public boolean isUserOrganizationMember(UUID userId, UUID organizationID) {
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

        if (userOrganizationRepository.existsByUserIdAndOrganizationId(userOrganization.getUser().getId(), userOrganization.getOrganization().getId())) {
            throw new GendoxException("USER_ORGANIZATION_ALREADY_EXISTS", "User-organization combination already exists", HttpStatus.BAD_REQUEST);
        }

        if (userOrganization.getId() != null) {
            throw new GendoxException("NEW_USER_ORGANIZATION_ID_IS_NOT_NULL", "User Organization id must be null", HttpStatus.BAD_REQUEST);
        }

        userOrganization = userOrganizationRepository.save(userOrganization);

        return userOrganization;
    }


    public UserOrganization updateUserRole(UUID userId, UUID organizationId, String roleName) throws GendoxException {
        UserOrganization userOrganization = userOrganizationRepository.findByUserIdAndOrganizationId(userId, organizationId);
        if (userOrganization == null) {
            throw new GendoxException("USER_ORGANIZATION_NOT_FOUND", "User-organization combination not found", HttpStatus.BAD_REQUEST);
        }
        Type role = typeService.getOrganizationRolesByName(roleName);
        userOrganization.setRole(role);
        return userOrganizationRepository.save(userOrganization);
    }

    public UserOrganization updateUserRole(UUID userOrganizationId, String roleName) throws GendoxException {
        UserOrganization userOrganization = userOrganizationRepository.findById(userOrganizationId).orElse(null);
        if (userOrganization == null) {
            throw new GendoxException("USER_ORGANIZATION_NOT_FOUND", "User-organization combination not found", HttpStatus.BAD_REQUEST);
        }
        Type role = typeService.getOrganizationRolesByName(roleName);
        userOrganization.setRole(role);
        return userOrganizationRepository.save(userOrganization);
    }


    public void deleteUserOrganization(UserOrganization userOrganization) throws GendoxException {
        userOrganizationRepository.delete(userOrganization);
    }

    public void deleteUserOrganization(UUID userId, UUID organizationId) throws GendoxException {
        UserOrganization userOrganization = userOrganizationRepository.findByUserIdAndOrganizationId(userId, organizationId);
        if (userOrganization == null) {
            throw new GendoxException("USER_ORGANIZATION_NOT_FOUND", "User-organization combination not found", HttpStatus.BAD_REQUEST);
        }
        userOrganizationRepository.delete(userOrganization);
    }

    @Transactional
    public void deleteAllUserOrganizationsByOrganizationId(UUID organizationId) {
        userOrganizationRepository.deleteByOrganizationId(organizationId);
    }


    public UserOrganization addUserToOrganization(UUID organizationId, UserOrganizationDTO userOrganizationDTO) throws Exception {
        if (!organizationId.equals(userOrganizationDTO.getOrganization().getId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserProfile userProfile = (UserProfile) authentication.getPrincipal();

        // Fetch the organizationUserDTO from the user's profile
        OrganizationUserDTO organizationUserDTO = userProfile.getOrganizations().stream()
                .filter(org -> org.getId().equals(organizationId.toString()))
                .findFirst()
                .orElseThrow(() -> new GendoxException("USER_NOT_IN_ORGANIZATION", "User is not in the organization", HttpStatus.BAD_REQUEST));

        // Retrieve the user's role from their authorities
        String invitingUserRole = organizationUserDTO.getAuthorities().stream()
                .filter(auth -> auth.startsWith("ROLE_"))
                .findFirst()
                .orElseThrow(() -> new GendoxException("USER_ROLE_NOT_FOUND", "User's role not found", HttpStatus.BAD_REQUEST));

        User invitedUser = userService.getById(userOrganizationDTO.getUser().getId());

        int invitingUserRoleLevel = userService.getUserOrganizationRoleLevel(invitingUserRole);
        int invitedUserRoleLevel = userService.getUserOrganizationRoleLevel(userOrganizationDTO.getRole().getName());

        if (invitedUserRoleLevel > invitingUserRoleLevel) {
            throw new GendoxException("INSUFFICIENT_ROLE", "You cannot assign a role higher than your own", HttpStatus.FORBIDDEN);
        }

        userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser));

        return this.createUserOrganization(invitedUser.getId(), organizationId, userOrganizationDTO.getRole().getName());

    }

}












