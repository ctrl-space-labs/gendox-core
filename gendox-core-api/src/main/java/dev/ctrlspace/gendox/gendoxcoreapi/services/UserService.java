package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.JwtDTOUserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserDetailsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserService implements UserDetailsService {

    private UserRepository userRepository;
    private JwtDTOUserProfileConverter jwtDTOUserProfileConverter;
    private JWTUtils jwtUtils;
    private UserProfileConverter userProfileConverter;


    @Autowired
    private UserService(UserRepository userRepository,
                        JWTUtils jwtUtils,
                        JwtDTOUserProfileConverter jwtDTOUserProfileConverter,
                        UserProfileConverter userProfileConverter) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.userProfileConverter = userProfileConverter;
        this.jwtDTOUserProfileConverter = jwtDTOUserProfileConverter;

    }

    public List<User> getAllUsers(UserCriteria criteria) {

        return userRepository.findAll();
    }

    public User getById(UUID id) throws GendoxException {
        return userRepository.findById(id)
                .orElseThrow(() -> new GendoxException("USER_NOT_FOUND", "User not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public User getByEmail(String email) throws GendoxException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new GendoxException("USER_NOT_FOUND", "User not found with email: " + email, HttpStatus.NOT_FOUND));
    }

    public UserProfile getProfileByEmail(String email) throws GendoxException {
        User user = getByEmail(email);
        return userProfileConverter.toDTO(user);
    }

    public JwtClaimsSet getJwtClaims(String email) throws GendoxException {

        UserProfile userProfile = this.getProfileByEmail(email);

        JwtDTO jwtDTO = jwtDTOUserProfileConverter.jwtDTO(userProfile);

        return jwtUtils.toClaimsSet(jwtDTO);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            return new UserDetailsDTO(getByEmail(email));
        } catch (GendoxException e) {
            throw new UsernameNotFoundException(e.getErrorCode(), e);
        }

    }
}
