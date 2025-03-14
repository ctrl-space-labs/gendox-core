#!/bin/bash
set -e

if keytool -list -keystore /opt/keycloak/conf/server.keystore -storepass "${KEYSTORE_PASSWORD}" -alias server > /dev/null 2>&1; then
  echo "Alias 'server' exists, deleting it."
  keytool -delete -alias server -keystore /opt/keycloak/conf/server.keystore -storepass "${KEYSTORE_PASSWORD}"
fi

echo "Generating new keystore and key pair."
keytool -genkeypair \
  -storepass "${KEYSTORE_PASSWORD}" \
  -storetype PKCS12 \
  -keyalg RSA \
  -keysize 2048 \
  -dname "CN=localhost" \
  -alias server \
  -validity 365 \
  -ext SAN:c=DNS:localhost,IP:127.0.0.1 \
  -keystore /opt/keycloak/conf/server.keystore

exec /opt/keycloak/bin/kc.sh start \
  --http-relative-path="${KEYCLOAK_HTTP_RELATIVE_PATH}" \
  --features=token-exchange \
  --hostname-strict=false \
  --https-key-store-file=/opt/keycloak/conf/server.keystore \
  --https-key-store-password "${KEYSTORE_PASSWORD}" \
  --spi-theme-static-max-age=600 \
  --spi-theme-cache-themes=true \
  --spi-theme-cache-templates=true
