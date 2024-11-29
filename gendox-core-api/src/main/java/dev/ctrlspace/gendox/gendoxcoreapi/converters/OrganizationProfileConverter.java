package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationProfileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserOrganizationProjectAgentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrganizationProfileConverter {

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



        return userProfileBuilder.build();

    }

}
