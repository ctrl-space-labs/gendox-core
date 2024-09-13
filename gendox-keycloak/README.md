# Keycloak Setup Guide

This guide outlines three different ways to run Keycloak based on your needs:

1. Run Keycloak directly (no container).
2. Run Keycloak with Docker Compose (default embedded database).
3. Run Keycloak with a custom database (Dockerfile).

---

### Option 1: Running Keycloak Directly (No Container)

You can run Keycloak directly on your machine without using containers. This is ideal if you prefer managing the Keycloak instance manually or need to run it in a local development environment without Docker.

#### Steps:
1. **Download Keycloak** from the [official website](https://www.keycloak.org/downloads).

2. **Unzip the file** to your desired directory and navigate to the `bin` folder.

3. **Start Keycloak in development mode** using the following command:

    - On Linux/Unix:
      ```bash
      bin/kc.sh start-dev
      ```

    - On Windows:
      ```bash
      bin\kc.bat start-dev
      ```

4. **To run Keycloak with an external database** like PostgreSQL, use the following command:

    - On Linux/Unix:
      ```bash
      bin/kc.sh start-dev --db=postgres --db-url=jdbc:postgresql://localhost:5432/keycloak --db-username=postgres --db-password=root
      ```

    - On Windows:
      ```bash
      bin\kc.bat start-dev --db=postgres --db-url=jdbc:postgresql://localhost:5432/keycloak --db-username=postgres --db-password=root
      ```

5. **Access Keycloak** by opening `http://localhost:8080` in your browser. You can log in using the default admin credentials.

#### Admin Setup:

When running Keycloak for the first time, you’ll need to create an admin user by setting the following environment variables or providing the admin credentials at startup:

- **KEYCLOAK_ADMIN**: The admin username (e.g., `admin`).
- **KEYCLOAK_ADMIN_PASSWORD**: The admin password (e.g., `admin`).

Example (Linux/Unix):
```bash
export KEYCLOAK_ADMIN=admin
export KEYCLOAK_ADMIN_PASSWORD=admin
bin/kc.sh start-dev
```

Once the server boots, go to `http://localhost:8080` and log in with the admin credentials.

---

### Option 2: Running Keycloak with Default Embedded Database (Docker Compose)

For a quick and simple setup, you can use Docker Compose with an embedded database. This method is perfect for development and testing.

#### Steps:
1. **Create an `.env` file**:
    ```env
    KC_DB_URL_HOST=postgres_keycloak
    KC_DB_URL_DATABASE=keycloakdb
    KC_DB_USERNAME=postgres
    KC_DB_PASSWORD=root
    KEYCLOAK_ADMIN=admin
    KEYCLOAK_ADMIN_PASSWORD=admin
    ```

2. **Run the Docker Compose file**:
    ```bash
    docker-compose up
    ```

3. Once Keycloak starts, access it at `http://localhost:8080` using the admin credentials specified in the `.env` file.

---

### Option 3: Running Keycloak with Custom Database (Dockerfile)

To run Keycloak with a custom configuration or database, you can build a Docker image using the provided `Dockerfile`.

#### Steps:
1. **Edit the `.env` file** with your custom database details:
    ```env
    KC_DB_URL_HOST=your_custom_db_host
    KC_DB_URL_DATABASE=your_custom_db_name
    KC_DB_USERNAME=your_custom_db_user
    KC_DB_PASSWORD=your_custom_db_password
    KEYCLOAK_ADMIN=admin
    KEYCLOAK_ADMIN_PASSWORD=admin
    ```

2. **Build the Docker image**:
    ```bash
    docker build -t custom-keycloak:25.0.4 .
    ```

3. **Run the container**:
    -
    - with an env file:
    ```bash
    docker run -p 8080:8080 --env-file .env custom-keycloak:25.0.4
    ```
   
   - without an env file:
    ```shell
    docker run -p 8080:8080 -e KC_DB_URL=jdbc:postgresql://host.docker.internal:5432/keycloak \
    -e KC_DB_USERNAME=postgres -e KC_DB_PASSWORD=root keycloak-postgres
    ```

4. Keycloak will be available at `http://localhost:8080`, and you can log in with the admin credentials specified in your `.env` file.

---

### Explanation of `.env` File Variables

- **KC_DB_URL_HOST**: The database host (e.g., `localhost` or `db-host`).
- **KC_DB_URL_DATABASE**: The name of the database.
- **KC_DB_USERNAME**: The database user.
- **KC_DB_PASSWORD**: The database password.
- **KEYCLOAK_ADMIN**: The Keycloak admin username.
- **KEYCLOAK_ADMIN_PASSWORD**: The Keycloak admin password.

These variables make it easy to configure Keycloak without modifying files directly. Whether using Docker Compose, a custom Dockerfile, or running Keycloak without containers, these environment variables streamline configuration.

---

### Conclusion

1. **For quick local testing**: Use Docker Compose for an easy-to-set-up Keycloak instance with an embedded PostgreSQL database.
2. **For production or custom setups**: Use a custom Dockerfile to build your own Keycloak image and configure it with your preferred database.
3. **For manual control**: Run Keycloak directly on your machine, allowing you to manage configurations and dependencies yourself.

For further information and configuration guides, visit [Keycloak's official documentation](https://www.keycloak.org/guides#server).to the [Keycloak configuration guides](https://www.keycloak.org/guides#server).