package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;


import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class UserDTO {

    private UUID id;
    private String name;
    private String firstName;
    private String lastName;
    private String userName;
    private String email;
    private String phone;
    private Type userType;
    private Instant createAt;
    private Instant updateAt;
}
