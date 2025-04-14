---
sidebar_position: 0
id: intro
slug: /
title: Introduction
---

# Gendox Tutorial Intro

Let's discover **Gendox in less than 5 minutes**.


# Gendox Introduction: Your First Steps

Welcome to **Gendox**, a powerful, no-code tool designed to unlock the potential of Generative AI for your projects. Whether you're looking to create a virtual assistant, automate workflows, or enable smarter customer interactions, Gendox provides the tools to achieve your goals quickly and efficiently.

This tutorial will guide you through setting up your first project, configuring an AI Agent, uploading data, and integrating external services. Let's get started!

---

## What is Gendox?

Gendox enables organizations to create AI-driven chat agents capable of expert-level conversations. By leveraging Generative AI and your unique data, Gendox transforms your information into powerful, interactive tools tailored to your needs. Here's what you can do with Gendox:

- **Train AI Agents** using your documents and customize their behavior.
- **Manage Projects** for different purposes across various industries.
- **Integrate Data Sources** like GitHub, AWS S3, and more for seamless data flow.
- **Engage Naturally** with users through intelligent conversations.

---

## Prerequisites

Before diving into Gendox, ensure you have the following ready:

1. **Technical Requirements**:
    - Java JDK 17 or later.
    - Maven for building the project.
    - PostgreSQL (v15+) with the `pgvector` extension installed.

2. **Gendox Repository**: Clone the project to your local environment using:
   ```
   git clone https://github.com/ctrl-space-labs/gendox-core.git
   ```

3. **Database Configuration**:
    - Ensure PostgreSQL is running and the `pgvector` plugin is installed.
    - Set up the database schema using Flyway:
      ```
      cd ./database
      mvn clean install flyway:migrate -Durl=jdbc:postgresql://localhost:5432/postgres -Duser=[your_user] -Dpassword=[your_pass]
      ```

---

## Create Your First Project

A Gendox project consists of two primary components:
1. **AI Agent**: The virtual assistant responsible for intelligent interaction.
2. **Data Pod**: The repository of documents used to train the AI Agent.

### Steps to Create a New Project

1. Navigate to the Gendox homepage.
2. Click the "+" button in the sidebar to add a new project.
3. Fill in the project name and description, then click **Submit**.
4. Select the project from the sidebar to open its configuration page.

---

## Configure the AI Agent

Your AI Agent combines the language model, behavior, and knowledge to create intelligent interactions.

### Steps to Configure an AI Agent

1. Open your project.
2. Access the **Settings**.
3. Configure the language model, agent role, and other settings.
4. Save the configuration.

For detailed instructions, check out the [Agent Setup Guide](#).

---

## Upload Data to Train the AI

Gendox currently supports text files in formats like `.txt` and `.md`. These files form the knowledge base for your AI Agent.

### Steps to Upload Documents

1. In the project’s page, click **Upload Documents**.
2. Drag and drop files or use the file picker to select documents.
3. Click **Upload** to add them to the project’s Data Pod.

---

## Train Your AI Agent

Training ensures the AI understands and interacts using your uploaded data.

### Steps to Train Your AI Agent

1. In the project’s **General** tab, click the **Training** button.
2. Wait for the process to complete. Training time may vary depending on the data size.

---

## Interact With Your AI Agent

Once trained, you can start chatting with your AI Agent.

### Steps to Chat With the Agent

1. Navigate to the **Chat** tab in the project’s page.
2. Select the Agent or chat thread.
3. Begin your conversation!

---

## Explore Integrations

Enhance your project by integrating Gendox with platforms like GitHub, AWS S3, and more. For detailed integration instructions, check the [Integration Guide](#).

---

Happy innovating with Gendox! 🚀


