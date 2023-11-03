package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators;

import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class NotEmptyOrSuperAdminValidator implements ConstraintValidator<NotEmptyOrSuperAdmin, String> {

        @Override
        public void initialize(NotEmptyOrSuperAdmin constraintAnnotation) {
            // Any initialization can be done here
        }

        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            if (isSuperAdmin()) {
                return true; // Skip validation if user is an admin
            }

            // Your custom validation logic here
            // For example, check if value follows a certain pattern
            if (!StringUtils.isNullOrEmpty(value)) {
                return true;
            }
            return false;
        }

        private boolean isSuperAdmin() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            return authentication != null && authentication.getAuthorities().stream()
                    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().startsWith(UserNamesConstants.GENDOX_SUPER_ADMIN));
        }
    }
