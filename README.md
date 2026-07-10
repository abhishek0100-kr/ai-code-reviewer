# IntelliCode AI Code Reviewer 🚀

A full-stack AI-powered code review platform that analyzes source code snippets and public GitHub repositories using Google Gemini. The application provides structured feedback on code quality, complexity, security, maintainability, and architecture while maintaining a persistent review history for authenticated users.

---

## 🌐 Live Demo

**Frontend:** https://ai-code-reviewer-frontend-pink.vercel.app

**Backend API:** https://ai-code-reviewer-api-3f1e.onrender.com

---

# Features

### 🤖 AI Code Review

- Analyze individual code snippets using Google Gemini.
- Generate structured feedback instead of plain conversational responses.
- Review:
  - Code Quality
  - Time Complexity
  - Space Complexity
  - Security Issues
  - Maintainability
  - Optimization Suggestions
  - Architecture Feedback

---

### 📂 Repository-Level Analysis

- Analyze entire public GitHub repositories.
- Fetch repository contents using the GitHub API.
- Filter unnecessary files before AI analysis.
- Generate project-level health insights.
- Detect issues across multiple source files.

---

### 🔐 Authentication

- User Registration
- Secure Login
- JWT Authentication
- Password hashing using bcryptjs
- Persistent user sessions

---

### 🔑 Password Recovery

- Forgot Password flow
- Secure password reset using SHA-256 hashed reset tokens
- 15-minute token expiration
- Single-use reset tokens
- Password reset emails powered by Resend

---

### 📊 Review History

- Store previous AI reviews in PostgreSQL.
- User-specific review history.
- Reload previous reports instantly.
- Repository and snippet reviews stored separately.

---

### 📄 Export Reports

Export AI analysis as:

- PDF
- Markdown

---

### 🛡️ Backend Security

- API Rate Limiting
- Request Size Limits
- Secure password hashing
- JWT-based authentication
- Generic authentication responses to reduce user enumeration risks
- Structured application logging using Winston

---

# Tech Stack

## Frontend

- Next.js (App Router)
- React
- Tailwind CSS
- Context API

## Backend

- Node.js
- Express.js

## Database

- PostgreSQL (Supabase)
- Prisma ORM

## AI

- Google Gemini API

## Authentication

- JWT
- bcryptjs

## Email

- Resend API

## Deployment

- Vercel (Frontend)
- Render (Backend)

---

# Architecture

```
                    User
                      │
                      ▼
        Next.js Frontend (Vercel)
                      │
              HTTPS REST API
                      │
                      ▼
      Express.js Backend (Render)
           │         │          │
           ▼         ▼          ▼
   Google Gemini   Resend   PostgreSQL
      API            API      (Supabase)
                              │
                              ▼
                         Prisma ORM
```

---

# Project Structure

```
ai-code-reviewer/

├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── page.js
│   │   ├── components/
│   │   └── context/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   ├── emailService.js
│   ├── logger.js
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

# Environment Variables

## Backend (.env)

```env
PORT=5000

DATABASE_URL=YOUR_DATABASE_URL

JWT_SECRET=YOUR_JWT_SECRET

GEMINI_API_KEY=YOUR_GEMINI_API_KEY

RESEND_API_KEY=YOUR_RESEND_API_KEY
```

---

## Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

# Local Setup

## Clone the Repository

```bash
git clone https://github.com/abhishek0100-kr/ai-code-reviewer.git

cd ai-code-reviewer
```

---

## Backend Setup

```bash
cd backend

npm install

npx prisma db push

npm start
```

---

## Frontend Setup

```bash
cd ../frontend

npm install

npm run dev
```

The frontend will run on:

```
http://localhost:3000
```

---

# Security Features

- Passwords are hashed using bcryptjs.
- JWT protects authenticated routes.
- Password reset tokens are hashed before database storage.
- Password reset tokens expire after 15 minutes.
- Password reset tokens are single-use.
- Rate limiting protects AI endpoints.
- Request payload limits prevent oversized requests.
- Winston provides structured server logging.

---

# Future Roadmap

- AI-powered code refactoring with interactive diff viewer
- Downloadable patch files
- Repository caching
- Change Password
- Email Verification
- Team collaboration
- Repository comparison
- Improved AI architecture recommendations

---

# License

This project is licensed under the MIT License.

---

# Author

**Abhishek Kumar**

GitHub: https://github.com/abhishek0100-kr