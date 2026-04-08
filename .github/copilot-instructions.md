# HOMEMADE Protein - Workspace Instructions

Project-wide standards for the "HOMEMADE Protein" full-stack application.

## Project Structure
- `client/`: Next.js (App Router) frontend.
- `server/`: Node.js/Express.js backend.
- `UPLOAD_ME_TO_GITHUB/`: Contains high-level project assets and documentation.

## Core Architecture
- **State Management**: React Context (`client/src/context/`).
- **Real-time Updates**: Socket.io for orders and notifications (`server/socket/`).
- **Database**: MongoDB with Mongoose (`server/models/`). 
- **Legacy Migration**: JSON-based data in `server/data/` is being migrated via `server/scripts/migrateToMongo.js`.

## Build and Run
- **Install All**: `npm run install:all`
- **Full-stack Dev**: `npm run dev` (starts both client and server)
- **Frontend only**: `cd client; npm run dev`
- **Backend only**: `cd server; npm run dev`

## Development Conventions
### Backend (Express)
- **Controllers**: Logic resides in `server/controllers/`.
- **Routes**: Define routes in `server/routes/` and export to `server/server.js`.
- **Middleware**: Use `auth.js` for JWT and `roleCheck.js` for "User/Chef/Admin" access control.
- **Mongoose Models**: Define schemas using PascalCase in `server/models/`.

### Frontend (Next.js)
- **App Router**: Use `client/src/app/` for layout and routing.
- **Client Components**: Mark with `'use client'` at the top.
- **API Calls**: Utility functions in `client/src/lib/api.js`.
- **Tailwind CSS**: Primary styling method. 

## Key Resources
- [Main README](client/README.md)
- [Project Documentation](PROJECT_DOCUMENTATION.md)
- [Share Instructions (Localtunnel)](SHARE_INSTRUCTIONS.md)

## Common Pitfalls
- **Port Conflict**: ensure `PORT` and `REACT_APP_BACKEND_URL` are correctly set.
- **Database Connection**: Verify MongoDB URI in environment variables or `server/config/db.js`.
- **JSON to Mongo**: When updating models, remember to check if `server/scripts/migrateToMongo.js` needs updates for data consistency.
