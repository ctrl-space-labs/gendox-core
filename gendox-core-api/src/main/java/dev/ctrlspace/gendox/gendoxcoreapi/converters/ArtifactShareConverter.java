package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactShare;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareOwnerViewDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareReaderViewDTO;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * A share as its owner sees it, and as a reader sees it. Read only: a share is made from a request, never from one
 * of these, so there is no toEntity. The users the views name are passed in, looked up once for a whole list.
 */
@Component
public class ArtifactShareConverter {

    /** One active share in the owner's Share dialog. */
    public ArtifactShareOwnerViewDTO toOwnerView(ArtifactShare share, Map<UUID, User> users) {
        User sharedWith = share.getSharedWithUserId() == null ? null : users.get(share.getSharedWithUserId());

        ArtifactShareOwnerViewDTO ownerView = new ArtifactShareOwnerViewDTO();
        ownerView.setId(share.getId());
        ownerView.setAudience(share.getAudienceType().getName());
        ownerView.setSharedWithUserId(share.getSharedWithUserId());
        ownerView.setSharedWithName(sharedWith == null ? null : nameOf(sharedWith));
        ownerView.setSharedWithEmail(sharedWith == null ? null : sharedWith.getEmail());
        ownerView.setVersion(share.getVersion());
        ownerView.setExpiresAt(share.getExpiresAt());
        ownerView.setCreatedAt(share.getCreatedAt());
        ownerView.setCreatedBy(share.getCreatedBy());

        return ownerView;
    }

    /**
     * A shared artifact as its reader sees it, without its conversation.
     *
     * @param shown the version with its content when one share is opened; null in a list, which shows no content
     */
    public ArtifactShareReaderViewDTO toReaderView(ArtifactShare share, UUID organizationId, Map<UUID, User> users,
                                                   @Nullable ArtifactVersion shown) {
        Artifact artifact = share.getArtifact();
        User sharedBy = users.get(share.getCreatedBy());
        boolean followsLatest = share.getVersion() == null;

        ArtifactShareReaderViewDTO readerView = new ArtifactShareReaderViewDTO();
        readerView.setShareId(share.getId());
        readerView.setAudience(share.getAudienceType().getName());
        readerView.setTitle(artifact.getTitle());
        readerView.setArtifactType(artifact.getArtifactType());
        readerView.setCodeLanguage(artifact.getCodeLanguage());
        readerView.setProjectId(artifact.getProjectId());
        readerView.setOrganizationId(organizationId);
        readerView.setSharedByName(sharedBy == null ? null : nameOf(sharedBy));
        readerView.setSharedAt(share.getCreatedAt());
        readerView.setExpiresAt(share.getExpiresAt());
        readerView.setFollowsLatest(followsLatest);
        readerView.setVersion(shown != null ? shown.getVersion() : followsLatest ? artifact.getLatestVersion() : share.getVersion());
        // a pinned version never changes: in a list, without the version at hand, it dates from the share
        readerView.setUpdatedAt(followsLatest ? artifact.getUpdatedAt() : shown != null ? shown.getCreatedAt() : share.getCreatedAt());
        readerView.setContent(shown == null ? null : shown.getContent());

        return readerView;
    }

    /** The name a person goes by here: their name, else first and last, else their email. */
    static String nameOf(User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return fullName.isEmpty() ? user.getEmail() : fullName;
    }
}