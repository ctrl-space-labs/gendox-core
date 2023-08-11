package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NotNullOrSuperAdminValidator.class)
public @interface NotNullOrSuperAdmin {

    String message() default "Field is not valid";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
