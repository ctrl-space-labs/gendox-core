#!/usr/bin/env bash
#
# Seeds development test users into the Gendox realm.
#
# Runs only in the local-development-test stack, after gendox-local-init.sh has
# created the realm and clients. That script creates clients but no end users, so
# without this there is no way to log in or to fetch a token headlessly.
#
# Bind-mounted (not COPYd into the image), so edits take effect on restart with no
# rebuild. Idempotent: re-running it is a no-op.
#
# The password here is a throwaway for an isolated local stack. Do not reuse this
# script anywhere a real user could exist.

set -euo pipefail

KCADM="/opt/keycloak/bin/kcadm.sh"
REALM_NAME="${REALM_NAME:-gendox-idp-prod}"
ADMIN_USER="${KEYCLOAK_ADMIN:-gendox_admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-changeit}"
KEYCLOAK_URL="${KEYCLOAK_URL:-https://localhost:8443/${KEYCLOAK_HTTP_RELATIVE_PATH:-idp}}"

# Matches the user seeded into gendox_core.users by the test-data migration, so the
# API can resolve the identity. Changing one without the other breaks login.
TEST_USER_EMAIL="${TEST_USER_EMAIL:-model-test@test.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-123456789}"

# The PKCE clients created by gendox-local-init.sh only enable the standard flow,
# which needs a browser. This one adds direct access grants so tests and curl can
# get a token with username/password.
TEST_CLIENT_ID="${TEST_CLIENT_ID:-gendox-dev-test-client}"

echo "Authenticating against ${KEYCLOAK_URL} as ${ADMIN_USER}"
$KCADM config credentials \
    --server "$KEYCLOAK_URL" \
    --realm master \
    --user "$ADMIN_USER" \
    --password "$ADMIN_PASSWORD" \
    --insecure

# ---------------------------------------------------------------------------
# Allow this stack's frontend port on the shared PKCE client.
#
# gendox-local-init.sh hardcodes GENDOX_BASE_URL=http://localhost:3000, so without
# this the frontend on 3100 fails login with an invalid redirect_uri. Patched here
# rather than in that script, which the other stacks share.
# ---------------------------------------------------------------------------
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3100}"
PKCE_CLIENT="${PKCE_CLIENT:-gendox-pkce-public-client-local}"

pkce_id=$($KCADM get clients -r "$REALM_NAME" -q clientId="$PKCE_CLIENT" --fields id --format csv --noquotes --insecure 2>/dev/null || true)

if [ -n "$pkce_id" ]; then
    echo "Adding ${FRONTEND_URL} to ${PKCE_CLIENT}"
    $KCADM update "clients/${pkce_id}" -r "$REALM_NAME" --insecure \
        -s "redirectUris=[\"http://localhost:3000/*\",\"${FRONTEND_URL}/*\"]" \
        -s "webOrigins=[\"http://localhost:3000\",\"${FRONTEND_URL}\"]" \
        -s 'directAccessGrantsEnabled=true'
else
    echo "WARNING: ${PKCE_CLIENT} not found - frontend login will fail"
fi

# ---------------------------------------------------------------------------
# Test client with direct access grants
# ---------------------------------------------------------------------------
existing_client=$($KCADM get clients -r "$REALM_NAME" -q clientId="$TEST_CLIENT_ID" --fields id --format csv --noquotes --insecure 2>/dev/null || true)

if [ -z "$existing_client" ]; then
    echo "Creating client ${TEST_CLIENT_ID}"
    $KCADM create clients -r "$REALM_NAME" --insecure \
        -s clientId="$TEST_CLIENT_ID" \
        -s enabled=true \
        -s publicClient=true \
        -s standardFlowEnabled=true \
        -s directAccessGrantsEnabled=true \
        -s 'redirectUris=["http://localhost:3100/*"]' \
        -s 'webOrigins=["http://localhost:3100"]'
else
    echo "Client ${TEST_CLIENT_ID} already exists, skipping"
fi

# ---------------------------------------------------------------------------
# Test user
# ---------------------------------------------------------------------------
existing_user=$($KCADM get users -r "$REALM_NAME" -q email="$TEST_USER_EMAIL" --fields id --format csv --noquotes --insecure 2>/dev/null || true)

if [ -z "$existing_user" ]; then
    echo "Creating user ${TEST_USER_EMAIL}"
    $KCADM create users -r "$REALM_NAME" --insecure \
        -s username="$TEST_USER_EMAIL" \
        -s email="$TEST_USER_EMAIL" \
        -s firstName="Model" \
        -s lastName="Tester" \
        -s enabled=true \
        -s emailVerified=true

    $KCADM set-password -r "$REALM_NAME" --insecure \
        --username "$TEST_USER_EMAIL" \
        --new-password "$TEST_USER_PASSWORD"
    echo "User created."
else
    echo "User ${TEST_USER_EMAIL} already exists, skipping"
fi

echo ""
echo "Fetch a token with:"
echo "  curl -sk -X POST ${KEYCLOAK_URL}/realms/${REALM_NAME}/protocol/openid-connect/token \\"
echo "    -d grant_type=password -d client_id=${TEST_CLIENT_ID} \\"
echo "    -d username=${TEST_USER_EMAIL} -d password=<password> -d scope='openid email'"
