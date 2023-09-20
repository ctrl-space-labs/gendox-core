# Gendox: Generate. Train. Evolve.
**by** [Ctrl+Space Labs](https://www.ctrlspace.dev/)

Gendox is a no-code tool that empowers you to harness the capabilities of Generative AI models. It assists organizations in leveraging their existing information to create intelligent AI chat agents. These agents can engage users in expert-level conversations on various topics. With Gendox, AI can communicate more naturally, enhancing the quality of interactions. Our platform offers the following features:

## Features

-  **Customizable AI Models:** Choose and customize AI models (e.g., GPT-4, Alpaca AI) to align with your specific requirements. 
-  **Adaptable to Any Industry:** Our solution is designed to adapt to any industry, enabling effective communication and support tailored to your domain. 
-   **Train with Your Materials:** Easily train the AI with your own materials, ensuring it understands and engages with your content effectively. 
-   **Flexible and Customizable:** Gendox can be trained from diverse resources and can adapt to any preferred character or style, allowing for highly customizable interactions. 
-   **Open Source:** We offer an open-source platform, providing transparency, flexibility, and collaboration opportunities for developers and researchers. 

## Use Cases 

Gendox's versatility makes it suitable for a wide range of applications:

-  **AI Tutor:** Create a virtual tutor that assists learners in various subjects, adapting to their unique learning styles. 
-  **AI Salesperson:** Develop an AI sales assistant that engages customers, answers queries, and boosts sales. 
-   **EU Grants Expert:** Empower organizations with an AI expert that navigates complex EU grant applications. 
-   **Plant Monitoring Expert:** Create an AI specialist in plant care and monitoring for farmers and enthusiasts. 
-  **Cultural Heritage Preservation:** Preserve cultural heritage by developing an AI curator that answers questions and provides insights.

## Technologies Used

### Backend
- Spring Boot: framework that simplifies the development of Java applications
- Java: high-level, object-oriented programming language
- Maven: build automation and project management tool in Java development

### Database
- PostgreSQL: open-source relational database management system (RDBMS)
- Flyway: database schema migration tool

  

## Getting Started 

To get started with the Gendox Core API project locally, you can follow the steps below to set up and run the project. 



### Prerequisites
Make sure you have the following prerequisites installed:

- Java JDK (at least Java 11)
- Maven
- postgreSQL v.15



### Clone the Repository 


1) Clone the Gendox Core API repository from GitHub: 
```
 
git clone https://github.com/ctrl-space-labs/gendox-core.git
 
```


2) Change the folder
```

cd gendox-core

```


3) Build the project using Maven

```

mvn clean install

```


4) Run the application

```

mvn spring-boot:run

```


### Set up the database
<br>

- After installing PostGreSQL server and the service is running on your machine (Windows may need restart) set the PATH enviroment variables to include:

 ```

  {POSTGRESQL_INSTALLATION_DIRECTORY}\{VERSION}\bin

  ```

  
- Then navigate to path:
  
```

{CLONED_DIRECTORY_PATH}/src/main/resources/migrations/

```


- Open a terminal and run:
  
```

psql -U postgres -d postgres -a -f V1_efant_db_schema.sql -W

```



### Restart the backend server


- close running application and run again the command:

 ```

  mvn spring-boot:run

  ```

### Maven depedencies

Gendox leverages several essential Maven dependencies to streamline project development. Here are some key dependencies:

- **Spring Boot**: A framework for rapid Java application development.
 ```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
</dependency>
```

- **Spring Data JPA**: Simplifies database access and data manipulation.
 ```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
```

- **Spring Security**: Provides authentication and authorization capabilities.
 ```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

- **QueryDSL**: Allows type-safe SQL-like queries.
 ```
<dependency>
    <groupId>com.querydsl</groupId>
    <artifactId>querydsl-core</artifactId>
    <version>${querydsl.version}</version>
</dependency>
```

- **Lombok**: Reduces boilerplate Java code through annotations.
 ```
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

These dependencies play a pivotal role in building and running the Gendox project, offering features like database access, security, and query capabilities. Additional dependencies and details can be found in the project's Maven pom.xml file.


## Join the Community

We believe in collaborative growth, and your contributions can help shape Gendox. Here's how you can get involved:

### How to Contribute

Want to help make Gendox even better? Fantastic! Get in touch with us by sending an email to [contact@ctrlspace.dev](mailto:contact@ctrlspace.dev).

### Report Issues

If you encounter any bugs or have suggestions for improvements, please [create an issue](https://github.com/ctrl-space-labs/gendox-core/issues).



---

© [Ctrl+Space Labs](https://www.ctrlspace.dev/)

