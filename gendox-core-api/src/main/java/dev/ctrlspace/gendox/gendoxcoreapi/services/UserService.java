package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.nimbusds.jwt.JWTClaimsSet;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserDetailsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.RolePermissionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private UserRepository userRepository;
    private UserOrganizationRepository userOrganizationRepository;
    private RolePermissionRepository rolePermissionRepository;
    private JWTUtils jwtUtils;


    @Autowired
    private UserService(UserRepository userRepository,
                        UserOrganizationRepository userOrganizationRepository,
                        JWTUtils jwtUtils,
                        RolePermissionRepository rolePermissionRepository) {
        this.userRepository = userRepository;
        this.userOrganizationRepository = userOrganizationRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.jwtUtils = jwtUtils;
    }

    public User getById(UUID id) throws GendoxException {
        return userRepository.findById(id)
                .orElseThrow(()-> new GendoxException("USER_NOT_FOUND", "User not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public User getByEmail(String email) throws GendoxException {
        return userRepository.findByEmail(email)
                .orElseThrow(()-> new GendoxException("USER_NOT_FOUND", "User not found with email: " + email, HttpStatus.NOT_FOUND));
    }

    public JwtClaimsSet getJwtClaims(String email) throws GendoxException {
        User user = getByEmail(email);
        List<UserOrganization> userOrganizations = userOrganizationRepository.findByUserId(user.getId());
        //unique role ids
        List<Long> roleIds = userOrganizations.stream()
                .map(userOrganization -> userOrganization.getRole().getId())
                .distinct()
                .collect(Collectors.toList());


        Map<String, List<String>> rolePermissionMap = getRoleToPermissionMapping(roleIds);


        Map<String, JwtDTO.OrganizationAuthorities> organizationAuthoritiesMap = getOrganizationAuthoritiesMapping(userOrganizations, rolePermissionMap);


        Instant now = Instant.now();
        JwtDTO jwtDTO = JwtDTO.builder()
                .iss("https://auth.gendox.com/")
                .sub(user.getId().toString())
                .aud(List.of("https://auth.gendox.com/", "https://api.gendox.com/", "https://app.gendox.com/"))
                .exp(now.plusSeconds(3600))
                .nbf(now)
                .iat(now)
                .jti(UUID.randomUUID().toString())
                .userId( user.getId())
                .email(user.getEmail())
                .globalRole(user.getGlobalRole().getName())
                .authoritiesMap(organizationAuthoritiesMap)
                .build();
        return jwtUtils.toClaims(jwtDTO);
    }

    /**
     * Get organization authorities mapping for given user organizations
     * eg: {
     *         UUID1: {
     *              organizationId: UUID1,
     *              authorities: [ROLE_ADMIN, READ, WRITE, DELETE]
     *         },
     *         UUID2: {
     *              organizationId: UUID2,
     *              authorities: [ROLE_READER, READ]
     *         }
     *     }
     *
     * @param userOrganizations
     * @param rolePermissionMap
     * @return
     */
    private static Map<String, JwtDTO.OrganizationAuthorities> getOrganizationAuthoritiesMapping(List<UserOrganization> userOrganizations, Map<String, List<String>> rolePermissionMap) {
        Map<String, JwtDTO.OrganizationAuthorities> organizationAuthoritiesMap = new HashMap<>();
        //User role in each organization
        for (UserOrganization userOrganization : userOrganizations) {
            JwtDTO.OrganizationAuthorities organizationAuthorities = organizationAuthoritiesMap.getOrDefault(userOrganization.getId().toString(), new JwtDTO.OrganizationAuthorities(new HashSet<>()));
            String roleName = userOrganization.getRole().getName();
            organizationAuthorities.orgAuthorities().add(roleName);
            organizationAuthoritiesMap.put(userOrganization.getId().toString(), organizationAuthorities);
            //Add role permissions
            if (rolePermissionMap.containsKey(roleName)) {
                organizationAuthorities.orgAuthorities().addAll(rolePermissionMap.get(roleName));
            }
        }
        return organizationAuthoritiesMap;
    }

    /**
     * Get role to permission mapping for given role ids
     * eg: {
     *          ROLE_ADMIN: [READ, WRITE, DELETE], 
     *          ROLE_READER: [READ],
     *          ROLE_SUPER_ADMIN: [READ, WRITE, DELETE, CREATE]
     *      }
     *
     * @param roleIds
     * @return
     */
    private Map<String, List<String>> getRoleToPermissionMapping(List<Long> roleIds) {
        Map<String, List<String>> rolePermissionMap = rolePermissionRepository.findByRoleIdIn(roleIds).stream()
                .collect(
                        Collectors.groupingBy(rolePermission -> rolePermission.getRole().getName(),
                                Collectors.mapping(rolePermission -> rolePermission.getPermission().getName(), Collectors.toList())));
        return rolePermissionMap;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        try {
            return new UserDetailsDTO(getByEmail(username));
        } catch (GendoxException e) {
            throw new UsernameNotFoundException(e.getErrorCode(), e);
        }

    }
}
