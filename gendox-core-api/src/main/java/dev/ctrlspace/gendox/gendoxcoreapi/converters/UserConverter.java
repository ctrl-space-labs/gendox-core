package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserDTO;
import org.springframework.stereotype.Component;

@Component
public class UserConverter implements GendoxConverter<User, UserDTO> {
    @Override
    public UserDTO toDTO(User user) throws GendoxException {
        UserDTO userDTO = new UserDTO();

        userDTO.setName(user.getName());
        userDTO.setFirstName(user.getFirstName());
        userDTO.setLastName(user.getLastName());
        userDTO.setUserName(user.getUserName());
        userDTO.setEmail(user.getEmail());
        userDTO.setPhone(user.getPhone());
        userDTO.setGlobalRole(user.getGlobalRole());
        userDTO.setUserType(user.getUserType());

        return userDTO;
    }

    @Override
    public User toEntity(UserDTO userDTO) {
       User user = new User();

        user.setName(userDTO.getName());
        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setUserName(userDTO.getUserName());
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        user.setGlobalRole(userDTO.getGlobalRole());
        user.setUserType(userDTO.getUserType());

        return user;
    }
}
