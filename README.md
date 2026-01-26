<div align="center">

<img src="https://img.icons8.com/fluency/96/gift.png" alt="GoneGift Logo" width="120"/>

# 🎁 GoneGift

### *Your legacy, delivered with care.*

**A secure platform for scheduling the posthumous delivery of messages, files, and digital assets to your loved ones.**

<br/>

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br/>

[**Explore Docs**](#-documentation) · [**Report Bug**](../../issues) · [**Request Feature**](../../issues)

---

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" alt="line" width="100%"/>

</div>

<br/>

## Project Structure

```
GoneGift/
├── Backend/       # Spring Boot application
└── Frontend/      # React application
```

---

##Getting Started

These instructions will help you set up the project locally on your system.

---

##Prerequisites

Make sure you have the following installed:

- [React.js](https://react.dev/learn/installation)
- [npm](https://www.npmjs.com/)
- [Java JDK](https://adoptium.net/) (17 or above)
- [Maven](https://maven.apache.org/) (comes with Spring Boot Starter, optional if using Spring Boot wrapper)
- [Git](https://git-scm.com/)
- [PostgreSQL](https://www.postgresql.org/) / [Supabase](https://supabase.com/) Create account with this platform 

---

##Running the Frontend

```bash
cd Frontend
npm install
npm start
```

This will start the React app on `http://localhost:5173`.

---

##Running the Backend

```bash
cd Backend/src/main/java/com/example/demo/DemoApplication.java

```
Run DemoApplication.java manually.


Or, if you have Maven installed globally:

```bash
cd Backend
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`.



##Features

- Upload letters and secrets
- Assign beneficiaries
- Schedule delivery after death
- Secure access with AES and magic links

---

##License

This project is licensed under the AGPL-3.0 license.
