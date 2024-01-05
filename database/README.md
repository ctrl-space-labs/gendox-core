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

#### Steps:

1. Pull the Docker Image
```bash
docker pull giannisy/gendox-database:1.0
```
2. Run the Docker Container
  - Replace <YOUR_DB_NAME>, <YOUR_DB_USER>, and <YOUR_DB_PASSWORD> with your desired database name, user, and password.
Create and start containers
```bash
docker run -d   
  -e POSTGRES_DB=<YOUR_DB_NAME> 
  -e POSTGRES_USER=<YOUR_DB_USER> 
  -e POSTGRES_PASSWORD=<YOUR_DB_PASSWORD> 
  -p <HOST_PORT>:5432
  --name my_database_container 
  giannisy/gendox-database:1.0
```

  - `-e`: Sets environment variables for configuring the MySQL instance.
  - `-p`: Maps the host port to the container port (replace <HOST_PORT> with the desired host port).
  - `--name`: Assigns a name to the Docker container.


3. Stop and restart the conteiner with all data saved
```bash
docker stop <my_database_container>
docker start <my_database_container>
```

4. Stop and remove container (all data will be deleted)
```bash
docker kill <my_database_container>
```
