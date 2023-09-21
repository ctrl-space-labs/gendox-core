## Gendox Database module

Gendox Uses Postgres DB, and in the future will support other DBs that support Vector capabilities.

This module is responsible for all database migrations. SQL queries can be found under `src/main/resources/db/migration` folder.


### Database Migrations
The Tool that is uses is Flyway. Flyway is an open-source database migration tool. It strongly favors simplicity and convention over configuration.
Once the DB is Stored locally on your machine, you can run the following command to run the migrations:


```bash
mvn clean install flyway:migrate -Durl=jdbc:postgresql://localhost:5432/postgres -Duser=your_username -Dpassword=your_password
```

There are also `flyway-{env}.conf` files that can be used to configure the DB connection and schema migrations.
By default, the `local` configuration file is used, but you can override it by passing the `Denv=dev` environment variable:

```bash
mvn clean install flyway:migrate -Denv=dev -Durl=jdbc:postgresql://localhost:5432/postgres -Duser=your_username -Dpassword=your_password
```
