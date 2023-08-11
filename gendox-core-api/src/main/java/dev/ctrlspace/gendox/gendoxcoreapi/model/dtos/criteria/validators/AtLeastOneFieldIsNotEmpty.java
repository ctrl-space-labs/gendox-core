package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.validators;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AtLeastOneFieldIsNotEmptyValidator.class)
public @interface AtLeastOneFieldIsNotEmpty {
    String message() default "At least one of the fields must have a value";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    String[] fieldNames() default {};
}
