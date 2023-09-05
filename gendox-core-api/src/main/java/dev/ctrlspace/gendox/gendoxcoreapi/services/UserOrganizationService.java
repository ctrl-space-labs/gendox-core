package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TypeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.UserOrganizationPredicate;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
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

    private TypeRepository typeRepository;
    private UserRepository userRepository;

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    public UserOrganizationService(UserOrganizationRepository userOrganizationRepository,
                                  TypeRepository typeRepository,
                                   UserRepository userRepository) {
        this.userOrganizationRepository = userOrganizationRepository;
        this.typeRepository = typeRepository;
        this.userRepository = userRepository;

    }

    public List<UserOrganization> getAll(UserOrganizationCriteria criteria) {
        return getAll(criteria, Pageable.unpaged());
    }

    public List<UserOrganization> getAll(UserOrganizationCriteria criteria, Pageable pageable) {
        return userOrganizationRepository.findAll(UserOrganizationPredicate.build(criteria), pageable).toList();

    }

    public void setAdminRoleForOrganizationsOwner(Organization organization) {
        UserOrganization userOrganization = new UserOrganization();
        Instant now = Instant.now();

        // user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt)authentication.getPrincipal());
        String userIdString = jwtDTO.getUserId(); // Assuming you have the UUID as a string
        UUID userId = UUID.fromString(userIdString);
        User user = userRepository.getById(userId);

        // role
        Type role = typeRepository.getById(3L);

        userOrganization.setUser(user);
        userOrganization.setOrganizationId(organization);
        userOrganization.setRole(role);
        userOrganization.setCreatedAt(now);
        userOrganization.setUpdatedAt(now);

        userOrganizationRepository.save(userOrganization);

    }
}












