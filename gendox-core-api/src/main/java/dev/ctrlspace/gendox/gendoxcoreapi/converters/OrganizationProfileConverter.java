package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationProfileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserOrganizationProjectAgentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.RolePermissionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.RolePermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class OrganizationProfileConverter {

    @Autowired
    private RolePermissionService rolePermissionService;

    public UserProfile toDTO(OrganizationProfileDTO organizationProfileDTO) throws GendoxException {
        if (organizationProfileDTO == null) {
            return null;
        }

        Type userType = new Type();
        userType.setId(organizationProfileDTO.getUserTypeId());
        userType.setName(organizationProfileDTO.getUserTypeName());
        UserProfile.UserProfileBuilder userProfileBuilder = UserProfile.builder()
                .id(organizationProfileDTO.getId())
                .phone(organizationProfileDTO.getPhone())
                .globalUserRoleType(organizationProfileDTO.getUserTypeId() != null ? userType : null)
                .name(organizationProfileDTO.getName());

        Set<String> authorities = new HashSet<>();
        authorities.add(organizationProfileDTO.getRoleName());

        Long roleIds = organizationProfileDTO.getRoleId();

        Map<String, List<String>> rolePermissionMap = rolePermissionService.getRoleToPermissionMapping(RolePermissionCriteria
                .builder()
                .roleIdIn(Collections.singletonList(organizationProfileDTO.getRoleId()))
                .build());

        if (rolePermissionMap.containsKey(organizationProfileDTO.getRoleName())) {
            authorities.addAll(rolePermissionMap.get(organizationProfileDTO.getRoleName()));
        }




        return userProfileBuilder.build();

    }

}
