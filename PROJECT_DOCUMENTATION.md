# HOMEMADE Protein - Comprehensive Project Documentation

This document covers everything required to build, maintain, and understand the **HOMEMADE Protein** project, a full-stack e-commerce and food delivery platform meant to serve homemade protein meals and products.

It is split into two main sections: **Frontend (Client)** and **Backend (Server)**. 

---

## 1. Project Overview & Architecture

**HOMEMADE Protein** is a modern Full-Stack web application tailored for ordering protein-rich meals, managing custom dietary requests, and providing real-time order tracking.

### Tech Stack
*   **Frontend**: Next.js 16 (React 18), Tailwind CSS, Framer Motion (animations), Axios, Socket.IO (Client).
*   **Backend**: Node.js, Express.js, Socket.IO (Server), Razorpay (Payment gateway).
*   **Database**: MongoDB (managed via Mongoose) with previously used JSON-based fallback data (`/server/data`).
*   **Authentication**: JSON Web Tokens (JWT) & bcryptjs for password hashing.
*   **File Uploads**: Multer (for item images/receipts).

---

## 2. Frontend Application (`/client`)

The frontend relies on **Next.js App Router** (`src/app`). It emphasizes responsive design via Tailwind CSS and interactive UI elements via Framer Motion.

### Directory Structure
*   `src/app/`: Contains all the Next.js page routes.
*   `src/components/`: Reusable React components.
*   `src/context/`: React Context (Global state management for Auth, Cart).
*   `src/lib/`: Utility functions (API client, Socket setup, image helpers, config).
*   `public/`: Static files (images, fonts).

### Core Features & Pages
*   **Auth Module** (`/auth/login`, `/auth/register`): Role-based login system for Users, Chefs, and Admins.
*   **Menu & Ordering** (`/menu`, `/menu/[id]`, `/checkout`): Displays protein meals (2D and 3D card variants). Users can add to cart, and process payment via Razorpay.
*   **User Roles & Dashboards**:
    *   **Admin Dashboard** (`/admin`): Oversee overall business, manage menu, view requests, system settings.
    *   **Chef Dashboard** (`/chef`): A dedicated portal for chefs to handle item preparation, acknowledge orders, and view new requests.
    *   **User Profile** (`/profile`): Track past orders, manage addresses, handle notifications.
*   **Order Tracking** (`/orders`, `/orders/[id]`): Shows physical and real-time step-by-step progress from order placed to delivered.
*   **Custom Requests** (`/requests`): Allows users to make highly customized diet or meal requests directly to the kitchen/chef.

### Key Components
*   `Navbar.js` / `Footer.js`: Global layout elements.
*   `CartSidebar.js`: An off-canvas overlay checking out cart context.
*   `ProductCard.js` / `ProductCard3D.js`: Cards displaying items. The 3D version applies Framer Motion for enhanced visual pop.
*   `OrderStatusTracker.js`: A stepper component rendering current order context (e.g., preparing, out for delivery).
*   `NoticeBoard.js`: A real-time or pinned alert board for users to see announcements.

---

## 3. Backend Architecture (`/server`)

The backend is an **Express.js API** providing REST endpoints alongside a **Socket.IO** server for real-time bidirectional communication.

### Directory Structure
*   `config/`: Database (MongoDB) connection and Razorpay initialization.
*   `controllers/`: Contains execution logic for endpoints (auth, menu, orders, admin).
*   `models/`: Mongoose Database schemas.
*   `routes/`: Express routers wiring URLs to Controllers.
*   `middleware/`: Security and file parsing (Auth checks, Role checks, Error Handler, Multer Uploads).
*   `socket/`: WebSocket event handlers (pushing order status updates, new requests).
*   `data/`: Contains legacy/seed JSON data (`users.json`, `menuItems.json`, `orders.json`) — heavily used before MongoDB migration.
*   `scripts/`: Database seeding and migration tools (`migrateToMongo.js`, `seedMenu3D.js`).

### Detailed Database Models (`/server/models`)
1.  **User**: Stores roles (`user`, `chef`, `admin`), email, encrypted passwords, address, and profile settings.
2.  **MenuItem**: Details of the food (name, description, macros/nutrition info, price, category, stock).
3.  **Order**: Links `User` and `MenuItems`. Tracks status (`pending`, `preparing`, `out_for_delivery`, `delivered`), amount, and Razorpay payment details.
4.  **Category**: Food categorizations (e.g., "Vegan", "Bulk", "Keto").
5.  **CustomRequest**: Contains personalized dietary plan requests submitted by users to chefs.
6.  **Review**: User ratings and comments mapped to a `MenuItem`.
7.  **Notification**: Real-time push payloads stored for history (e.g., "Your order is ready!").
8.  **Settings**: General platform toggle configurations.

### Key Backend Processes
*   **Authentication Middleware** (`middleware/auth.js`, `roleCheck.js`): Intercepts requests, validates JWT cookies/headers. `roleCheck` ensures a user trying to hit `/admin/...` is actually an Admin.
*   **Payment Flow** (`controllers/paymentController.js`): Uses the razorpay Node SDK. The server generates an Order ID, sends it to the client. After UI completion, Razorpay verifies payment hashes via a webhook/callback.
*   **Real-time Sockets** (`socket/index.js`): Uses rooms based on user ID and roles. E.g., when an order is updated, an event is emitted directly to `room_user_<user_id>`.

---

## 4. Workflows & Interactions

1.  **Placing an Order**:
    *   User views `/menu`, powered by `GET /api/menu`.
    *   Adds to `CartContext`, triggers `CartSidebar`.
    *   Goes to `/checkout`. React posts to `POST /api/orders` & `POST /api/payments/create-order`.
    *   Razorpay handles UI, backend verifies signature in `/api/payments/verify`.
    *   Socket emits `NEW_ORDER` to `room_admins` and `room_chefs`.
2.  **Order Processing**:
    *   Chef logs in, views `/chef`. Sees the new order.
    *   Chef clicks "Start Preparing". Next.js calls `PUT /api/orders/:id/status`.
    *   Backend updates Mongo.
    *   Backend Socket emits `ORDER_STATUS_UPDATED` to `room_user_<id>`.
    *   User sees UI update instantly on `OrderStatusTracker.js`.
3.  **Data Migration**:
    *   Initially built using local JSON (`data/`). 
    *   Scripts like `scripts/migrateToMongo.js` transfer old JSON legacy entries safely to MongoDB Collections.

---

## 5. Development Setup & Launch

To successfully run both ends locally:

### Backend
1. `cd server`
2. `npm install`
3. Ensure `.env` is setup with: 
   * `MONGO_URI`
   * `JWT_SECRET`
   * `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
4. Run `npm run dev` to start Express with `nodemon` (port 5000 by default).

### Frontend
1. `cd client`
2. `npm install`
3. Provide `.env.local` containing `NEXT_PUBLIC_API_URL` (usually `http://localhost:5000/api`) and Razorpay public keys.
4. Run `npm run dev` to start Next.js on port 3000.

---
*Created by GitHub Copilot.*