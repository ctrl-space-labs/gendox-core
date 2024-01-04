#!/bin/bash

echo '----    Restarting DB to enable IPv4 database listener    ----'
pg_ctl -D "$PGDATA" -m fast -w stop
pg_ctl -D "$PGDATA" \
            -o "-c listen_addresses='localhost'" \
            -w start
echo '-----------------    Restart complete    ---------------------'

mvn clean install flyway:migrate

