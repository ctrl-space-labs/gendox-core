# Keycloak for ephemeral environments. Build context: gendox-keycloak/.
#
# Every build-time option is set here, so `start --optimized` skips the rebuild
# that the shared gendox-keycloak image runs on each start. The realm comes from
# gendox-idp-prod-realm.json, so this image needs neither kcadm nor jq.
FROM quay.io/keycloak/keycloak:26.4.7

COPY ./themes /opt/keycloak/themes/

ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_FEATURES=token-exchange
ENV KC_HTTP_RELATIVE_PATH=/idp
ENV KC_CACHE=local

RUN /opt/keycloak/bin/kc.sh build
