# DevPulse

DevPulse is a GitHub-focused engineering analytics and team visibility platform built for organizations that want better insight into development activity, repository health, and delivery performance.

It brings together repository metadata, GitHub events, CI/CD activity, deployment signals, and automated engineering insights into a single operational dashboard.

## Overview

DevPulse helps engineering teams:
- track organization and repository activity in real time
- monitor pull request and deployment performance
- surface engineering metrics from GitHub webhooks
- visualize delivery health across teams and repositories
- get automated, rule-based insights from repository and workflow data
- keep project activity visible through a live dashboard

## Features

- Organization and repository management
- GitHub OAuth authentication and secure token handling
- Invite-code based organization onboarding
- Real-time webhook processing for GitHub events
- Redis + BullMQ background job handling
- Socket.IO live dashboard updates
- Deployment, PR, and activity analytics
- Automated metrics summaries and rule-based recommendations
- Responsive frontend built with React + Vite

## Tech Stack

Backend
- Node.js
- Express.js
- PostgreSQL + Prisma ORM
- Redis
- BullMQ
- Socket.IO

Frontend
- React
- Vite
- Tailwind CSS
- Recharts

## Project Structure

```text
Devpulse/
├── prisma/                  # Prisma schema and migrations
├── src/                    # Backend application code
│   ├── config/             # DB and Redis config
│   ├── controllers/        # API controllers
│   ├── middleware/         # Auth, rate limiting, and error handling
│   ├── pubsub/             # Redis pub/sub listeners and publisher
│   ├── queues/             # BullMQ queue definitions
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic and GitHub integrations
│   ├── socket/             # WebSocket setup
│   ├── utils/              # Helper utilities
│   └── workers/            # Background job workers
├── frontend/               # React frontend app
├── .env.example            # Sample environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Root app scripts and dependencies
├── server.js               # Express server entry point
├── worker.js               # Worker entry point
└── README.md               # Project documentation
```

## Prerequisites

Before running the project locally, make sure you have:
- Node.js 18+ recommended
- PostgreSQL installed and running
- Redis installed and running
- GitHub OAuth app credentials (optional for full GitHub integration)

## Local Setup

1. Clone the repository

```bash
git clone <your-repo-url>
cd Devpulse
```

2. Install dependencies

```bash
npm install
npm install --prefix frontend
```

3. Configure environment variables

Copy the sample environment file and update the values:

```bash
cp .env.example .env
```

Then update `.env` with your real values, especially:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_WEBHOOK_SECRET`
- `REDIS_URL` or Redis host settings

4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

If you prefer migrations:

```bash
npx prisma migrate dev
```

5. Run the app

Backend:

```bash
npm start
```

Frontend:

```bash
npm run dev --prefix frontend
```

The frontend will run on the default Vite dev server port, usually `http://localhost:5173`.
The backend API typically runs on `http://localhost:3000`.

## Environment Variables

A complete template is available in [`.env.example`](./.env.example).

Key variables:

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devpulse
REDIS_URL=redis://localhost:6379
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

## Production Notes

Before pushing to GitHub or deploying:
- never commit your real `.env` file
- keep demo or development secrets in GitHub Actions secrets or hosting environment variables
- set secure JWT secrets and webhook secrets for production
- run a production build:

```bash
npm run build
```

## Deployment

This project is designed to be deployable as a single-service app or as a split frontend/backend deployment.

Typical deployment setup:
- Backend: Node.js service on Render, Railway, Fly.io, or a VM
- Database: PostgreSQL
- Cache/queue: Redis
- Frontend: Vite static build hosted separately or served from the Express app in production

## Security

The project includes the following protections:
- JWT authentication middleware
- CORS configuration
- Helmet security headers
- Redis-backed rate limiting
- webhook signature validation patterns for GitHub events
- environment-based secrets for sensitive configuration

## GitHub Push Checklist

Before pushing code:
- ensure `.env` is ignored
- keep only `.env.example` tracked
- verify there are no local secrets or generated artifacts committed
- test the build locally

```bash
git status
git add .
git commit -m "Initial project setup"
git push origin main
```

## License

This project is currently provided as an internal/development project. Add your preferred license before public release.

## Future Improvements

Possible next steps for the project:
- stronger CI/CD checks with GitHub Actions
- automated tests for controllers and services
- performance optimization for analytics queries
- optional integration with a verified generative AI provider for richer summaries
- team-level dashboards and RBAC
- deployment pipeline and observability tools

## Contributing

Contributions are welcome. Please create a feature branch, make your changes, and open a pull request with a clear description of the update.
