package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class UserDTO {

    private UUID id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
}
