#!/bin/bash

# ============================================
# Configuration Variables
# ============================================

# Admin credentials
ADMIN_USER="gendox_admin"
ADMIN_PASSWORD="changeit"
KEYCLOAK_URL="http://localhost:8080/idp"

# Realm name
REALM_NAME="gendox-idp-prod"

# Base URLs
GENDOX_BASE_URL="http://localhost:3000"
PROVEN_BASE_URL="http://localhost:3001"

# Client names
GENDOX_PKCE_CLIENT="gendox-pkce-public-client-local"
PROVEN_PKCE_CLIENT="proven-pkce-public-client-local"
GENDOX_PRIVATE_CLIENT="gendox-private-client"
PROVEN_PRIVATE_CLIENT="proven-ai-private-client"

# Client secrets for private clients
GENDOX_PRIVATE_SECRET="your-gendox-secret"
PROVEN_PRIVATE_SECRET="your-proven-secret"

# Path to kcadm.sh
KCADM="../bin/kcadm.sh"

# ============================================
# Script Execution
# ============================================

# Login
echo "Logging into $KEYCLOAK_URL as user $ADMIN_USER of realm master"
$KCADM config credentials --server "$KEYCLOAK_URL" \
                          --realm master \
                          --user "$ADMIN_USER" \
                          --password "$ADMIN_PASSWORD"

# Create Realm if it doesn't exist
echo "Checking if realm '$REALM_NAME' exists..."
if ! $KCADM get realms/"$REALM_NAME" > /dev/null 2>&1; then
  echo "Creating realm '$REALM_NAME'..."
  $KCADM create realms -s realm="$REALM_NAME" -s enabled=true
  echo "Realm '$REALM_NAME' created successfully."
  # Set default realm settings
  echo "Setting default realm settings for '$REALM_NAME'..."
  $KCADM update realms/"$REALM_NAME" \
      -s registrationAllowed=true \
      -s resetPasswordAllowed=true \
      -s rememberMe=false \
      -s registrationEmailAsUsername=false \
      -s loginWithEmailAllowed=true \
      -s duplicateEmailsAllowed=false \
      -s verifyEmail=false \
      -s editUsernameAllowed=true \
      -s loginTheme="gendox"
  echo "Default realm settings updated successfully."
else
  echo "Realm '$REALM_NAME' already exists. Doing nothing..."
fi

# Function to create PKCE Client
create_pkce_client() {
  CLIENT_ID=$1
  BASE_URL=$2
  POST_LOGOUT_REDIRECT_URI=$3

  echo "Processing PKCE client '$CLIENT_ID'..."

  CLIENT_UUID=$($KCADM get clients -r "$REALM_NAME" -q clientId="$CLIENT_ID" --fields id --format json | jq -r '.[0].id')

  if [ "$CLIENT_UUID" = "null" ] || [ -z "$CLIENT_UUID" ]; then
    echo "Creating PKCE client '$CLIENT_ID'..."
    $KCADM create clients -r "$REALM_NAME" -f - <<EOF
{
  "clientId": "$CLIENT_ID",
  "enabled": true,
  "publicClient": true,
  "protocol": "openid-connect",
  "redirectUris": ["$BASE_URL/*"],
  "webOrigins": ["$BASE_URL"],
  "rootUrl": "$BASE_URL",
  "baseUrl": "$BASE_URL",
  "alwaysDisplayInConsole": true,
  "frontchannelLogout": true,
  "standardFlowEnabled": true,
  "attributes": {
    "pkce.code.challenge.method": "S256",
    "post.logout.redirect.uris": "$POST_LOGOUT_REDIRECT_URI"
  }
}
EOF
    echo "PKCE client '$CLIENT_ID' created successfully."
  else
    echo "PKCE client '$CLIENT_ID' already exists. Doing nothing..."
  fi
}

# Function to create Private Client with Secret
create_private_client() {
  CLIENT_ID=$1
  CLIENT_SECRET=$2

  echo "Processing private client '$CLIENT_ID'..."

  CLIENT_UUID=$($KCADM get clients -r "$REALM_NAME" -q clientId="$CLIENT_ID" --fields id --format json | jq -r '.[0].id')

  if [ "$CLIENT_UUID" = "null" ] || [ -z "$CLIENT_UUID" ]; then
    echo "Creating private client '$CLIENT_ID'..."
    $KCADM create clients -r "$REALM_NAME" \
        -s clientId="$CLIENT_ID" \
        -s enabled=true \
        -s publicClient=false \
        -s protocol=openid-connect \
        -s serviceAccountsEnabled=true \
        -s clientAuthenticatorType=client-secret \
        -s secret="$CLIENT_SECRET"
    echo "Private client '$CLIENT_ID' created successfully."
  else
    echo "Private client '$CLIENT_ID' already exists. Doing nothing..."
  fi
}

# Function to assign roles to Service Account
assign_role_to_service_account() {
  CLIENT_ID=$1
  ROLE_NAME=$2

  SERVICE_ACCOUNT_USERNAME="service-account-$CLIENT_ID"

  echo "Assigning role '$ROLE_NAME' to service account '$SERVICE_ACCOUNT_USERNAME'..."

  # Check if role is already assigned
  if ! $KCADM get-roles -r "$REALM_NAME" --uusername "$SERVICE_ACCOUNT_USERNAME" --cclientid realm-management | grep -q "\"$ROLE_NAME\""; then
    $KCADM add-roles -r "$REALM_NAME" --uusername "$SERVICE_ACCOUNT_USERNAME" --cclientid realm-management --rolename "$ROLE_NAME"
    echo "Role '$ROLE_NAME' assigned to '$SERVICE_ACCOUNT_USERNAME'."
  else
    echo "Role '$ROLE_NAME' already assigned to '$SERVICE_ACCOUNT_USERNAME'."
  fi
}

# Create PKCE Clients
echo "=== Creating PKCE Clients ==="
create_pkce_client "$GENDOX_PKCE_CLIENT" "$GENDOX_BASE_URL" "$GENDOX_BASE_URL/login"
create_pkce_client "$PROVEN_PKCE_CLIENT" "$PROVEN_BASE_URL" "$PROVEN_BASE_URL/login"
echo "=== PKCE Clients Processing Complete ==="

# Create Private Clients and Set Secrets
echo "=== Creating Private Clients ==="
create_private_client "$GENDOX_PRIVATE_CLIENT" "$GENDOX_PRIVATE_SECRET"
create_private_client "$PROVEN_PRIVATE_CLIENT" "$PROVEN_PRIVATE_SECRET"
echo "=== Private Clients Processing Complete ==="

# Assign Roles to Service Accounts
echo "=== Assigning Roles to Service Accounts ==="
ROLES=("manage-users" "impersonation" "query-users" "view-users")
for ROLE in "${ROLES[@]}"; do
  assign_role_to_service_account "$GENDOX_PRIVATE_CLIENT" "$ROLE"
  assign_role_to_service_account "$PROVEN_PRIVATE_CLIENT" "$ROLE"
done
echo "=== Role Assignment Complete ==="

echo "Script execution finished successfully."
