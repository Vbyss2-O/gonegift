# 🎁 GoneGift

GoneGift is a digital legacy platform where users can save files, letters, and secrets to be delivered to their beneficiaries after their death. This project uses a **React** frontend and **Spring Boot** backend.
and used Database Postgres(SQL Based

---

## 📁 Project Structure

```
GoneGift/
├── Backend/       # Spring Boot application
└── Frontend/      # React application
```

---

## 🚀 Getting Started

These instructions will help you set up the project locally on your system.

---

## 📦 Prerequisites

Make sure you have the following installed:

- [React.js](https://react.dev/learn/installation)
- [npm](https://www.npmjs.com/)
- [Java JDK](https://adoptium.net/) (17 or above)
- [Maven](https://maven.apache.org/) (comes with Spring Boot Starter, optional if using Spring Boot wrapper)
- [Git](https://git-scm.com/)
- [PostgreSQL](https://www.postgresql.org/) / [Supabase](https://supabase.com/) Create account with this platform 

---

## 🖥️ Running the Frontend

```bash
cd Frontend
npm install
npm start
```

This will start the React app on `http://localhost:5173`.

---

## 🔧 Running the Backend

```bash
cd Backend/src/main/java/com/example/demo/DemoApplication.java
```

Or, if you have Maven installed globally:

```bash
cd Backend
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`.

Make sure to configure any environment variables or `application.properties` for your database/API keys.

---

## 🌐 Connecting Frontend and Backend

Ensure your React app makes API requests to the correct backend URL (e.g., `http://localhost:8080/api/...`).



---

## ✅ Features

- Upload letters and secrets
- Assign beneficiaries
- Schedule delivery after death
- Secure access with AES and magic links

---

## 📜 License

This project is licensed under the AGPL-3.0 license.
