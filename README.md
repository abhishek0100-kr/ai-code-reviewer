# IntelliCode AI Code Reviewer 🚀

An AI-powered code review platform that analyzes source code and provides structured feedback on code quality, complexity, security, readability, and optimization opportunities.

## 🌐 Live Demo

**Application:** https://ai-code-reviewer-frontend-pink.vercel.app

---

## 📖 Overview

IntelliCode helps developers review and improve their code using AI. Users can paste code snippets, receive detailed analysis, track review history, and securely manage their accounts through an authentication system.

The platform is built using a modern full-stack architecture with:

* Next.js frontend
* Express.js backend
* Google Gemini AI
* PostgreSQL database (Supabase)
* Prisma ORM
* JWT Authentication

---

## 🏗️ Architecture

```text
User
 │
 ▼
Next.js Frontend (Vercel)
 │
 ▼
Express.js Backend (Render)
 │
 ├── Google Gemini API
 │
 └── PostgreSQL Database (Supabase)
```

---

## ✨ Features

### 🔍 AI Code Review

Analyze code and receive:

* Code quality feedback
* Time complexity analysis
* Space complexity analysis
* Security observations
* Optimization suggestions
* Readability improvements
* Best practice recommendations

### 🔐 Authentication System

* User Registration
* User Login
* JWT-based Authentication
* Password Hashing with bcryptjs

### 📚 Review History

* Stores previous AI reviews
* Retrieve past analyses instantly
* Persistent cloud database storage

### 🌍 Multi-Language Support

Supports analysis for:

* JavaScript
* Python
* Java
* C
* C++
* Go

---

## 🛡️ Security & Production Hardening

### API Rate Limiting

Implemented using `express-rate-limit` to prevent abuse and protect AI API quotas.

### Request Size Protection

Configured payload limits to prevent oversized requests from consuming excessive server resources.

### Secure Password Storage

Passwords are hashed using bcrypt before being stored in the database.

### JWT Authentication

Protected routes require valid authentication tokens.

### Structured Logging

Implemented Winston logging for:

* Error tracking
* Request monitoring
* Debugging
* Production observability

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* Context API

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL (Supabase)
* Prisma ORM

### AI Integration

* Google Gemini API

### Authentication & Security

* JWT (jsonwebtoken)
* bcryptjs
* express-rate-limit

### Logging

* Winston

---

## 📁 Project Structure

```text
ai-code-reviewer/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── index.js
│   ├── logger.js
│   ├── package.json
│   └── prisma/
│
└── README.md
```

---

## 🚀 Local Setup

### Clone Repository

```bash
git clone https://github.com/abhishek0100-kr/ai-code-reviewer.git

cd ai-code-reviewer
```

### Backend Setup

```bash
cd backend

npm install

npm start
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 🌍 Deployment

### Frontend

* Vercel

### Backend

* Render

### Database

* Supabase PostgreSQL

---

## 📈 Future Roadmap

### Repository-Level Analysis

Analyze entire GitHub repositories instead of individual code snippets.

### AI Architecture Auditor

Generate system design and architecture-level feedback for complete projects.

### Exportable Reports

Allow users to download AI review reports as PDF or Markdown files.

### Team Collaboration

Enable shared workspaces and collaborative code reviews.

---

## 🎯 Key Learning Outcomes

This project helped me gain practical experience with:

* Full-Stack Development
* REST API Design
* Authentication & Authorization
* Database Design with PostgreSQL
* Prisma ORM
* Cloud Deployment
* AI Integration
* Production Security Practices
* Rate Limiting & Logging
* Modern React & Next.js Development

---

## 👨‍💻 Author

**Abhishek Kumar**

B.Tech CSE (AI & ML)

Vellore Institute of Technology (VIT)

GitHub: https://github.com/abhishek0100-kr
