package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactSharingDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactSharingDTO.Person;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactSharingService.Sharing;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * The share dialog of an artifact. The artifact keeps only user ids; the names and emails are read here, for
 * everyone in the dialog at once.
 */
@Component
public class ArtifactSharingConverter {

    private final UserRepository userRepository;

    public ArtifactSharingConverter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public ArtifactSharingDTO toDTO(Sharing sharing) {
        UUID ownerId = sharing.artifact().getOwnerId();
        List<UUID> userIds = Stream.concat(Stream.ofNullable(ownerId),
                        sharing.members().stream().map(ArtifactMember::getUserId))
                .distinct()
                .toList();
        Map<UUID, User> users = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return ArtifactSharingDTO.builder()
                .artifactId(sharing.artifact().getId())
                .yourRole(sharing.role().name())
                .owner(ownerId == null ? null : person(ownerId, users, null))
                .members(sharing.members().stream()
                        .map(member -> person(member.getUserId(), users, member.getRole().getName()))
                        .toList())
                .generalAccessRole(sharing.artifact().getGeneralAccessRole() == null
                        ? null : sharing.artifact().getGeneralAccessRole().getName())
                .publicId(sharing.artifact().getPublicId())
                .publicAt(sharing.artifact().getPublicAt())
                .build();
    }

    private static Person person(UUID userId, Map<UUID, User> users, @Nullable String role) {
        User user = users.get(userId);
        return Person.builder()
                .userId(userId)
                .name(user == null ? null : ArtifactService.nameOf(user))
                .email(user == null ? null : user.getEmail())
                .role(role)
                .build();
    }

    /** The name, else the first and last name, else the email. */
    private static String nameOf(User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return fullName.isEmpty() ? user.getEmail() : fullName;
    }
}