-- Invitations already applied to registered accounts must not restore revoked memberships.
-- Keep accepted invitations for future registrations available until their normal expiry.
UPDATE gendox_core.invitations i
SET token = ''
WHERE i.status_type_id IN (
    SELECT id FROM gendox_core.types WHERE name = 'ACCEPTED' AND type_category = 'USER_INVITATION_STATUS'
)
AND EXISTS (
    SELECT 1 FROM gendox_core.users u WHERE lower(u.email) = lower(i.invitee_email)
);
