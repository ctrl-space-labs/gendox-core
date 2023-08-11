package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.RoleNamesConstants;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.BeansException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class AtLeastOneFieldIsNotEmptyValidator implements ConstraintValidator<AtLeastOneFieldIsNotEmpty, Object> {

    private String[] fieldNames;

    @Override
    public void initialize(AtLeastOneFieldIsNotEmpty constraintAnnotation) {
        this.fieldNames = constraintAnnotation.fieldNames();
    }

    @Override
    public boolean isValid(Object criteria, ConstraintValidatorContext context) {
        if (fieldNames.length == 0) {
            return true;  // No fields specified to validate
        }
        if (isSuperAdmin()) {
            return true; // Skip validation if user is an admin
        }

        for (String fieldName : fieldNames) {
            try {
                Object propertyValue = new BeanWrapperImpl(criteria).getPropertyValue(fieldName);

                if (propertyValue instanceof String str && !str.isBlank()) {
                    return true;
                }
            } catch (BeansException e) {
                // Field does not exist on the object
            }
        }
        return false;
    }

    private boolean isSuperAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().startsWith(RoleNamesConstants.SUPER_ADMIN));
    }
}
