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


### Using Docker

- Install Docker according to [Get Docker](https://docs.docker.com/get-docker/)

- Create an `.env` file with the directory ./database with the required environment variables, for values ​​you can put your own, like this:

```bash
POSTGRES_DB=******
POSTGRES_USER=******
POSTGRES_PASSWORD=******
PORT=****
```

Then you need to Build or rebuild services
```bash
docker-compose build
```

Create and start containers
```bash
docker-compose up
```
- or if you want to run containers in the background
```bash
docker-compose up -d
```

Stop and restart the conteiners with all data saved
```bash
docker-compose stop
docker-compose start
```

Stop and remove containers, networks (all data will be deleted)
```bash
docker-compose down
```
