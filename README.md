# Full-Stack Inventory Management System

A full-stack web application to manage product inventory, order placement, real-time delivery milestone tracking, and analytics with a React frontend and Node.js backend.

## Features
- **User Authentication & Role-Based Access Control**: Login & Registration with JWT (Admin & Customer/User roles)
- **Customer / User Dashboard**:
  - **My Orders**: Product details, unit/total price, quantity, order date, expected delivery date, and color-coded status badges
  - **Delivery Tracking**: Visual step timeline (`Order Placed → Order Confirmed → Packed → Shipped → Out for Delivery → Delivered`) with expected and actual delivery timestamps
  - **Delivery Status Lifecycle**: Clear badges for `Pending`, `Processing`, `Confirmed`, `Packed`, `Shipped`, `Out for Delivery`, `Delivered`, `Delayed` (with updated expected delivery date & reason), and `Cancelled`
  - **Product Availability & Stock Limits**: Live indicators for Available Stock, Low Stock, and Out of Stock; strictly prevents ordering more than available stock
  - **Order History**: Review past purchases, total spend, delivery dates, with search and status filters
  - **Notifications**: Real-time alerts in Navbar dropdown and Dashboard feed for Confirmed, Shipped, Out for Delivery, Delivered, and Delayed orders
- **Admin Dashboard**:
  - Daily Sales Analytics (Gross revenue, units sold, transaction count)
  - Daily Sales Trend Chart (Hourly, 7-day, and monthly views)
  - Product-wise Sales & Stock Flow Table
  - Stock Status Overview & Low / Out-of-Stock alert tables
  - Delivery Tracking Log with status filtering and delayed delivery rescheduling
- **Product Management**: Add, edit, view details, search, and delete products

## Technologies Used
- **Frontend**: React, Vite, React Router DOM, Axios, Lucide React (Icons), CSS3
- **Backend**: Node.js, Express.js, MongoDB & Mongoose, JWT, bcryptjs

---

## How to Run in VS Code Terminal

Open **VS Code** with this project folder: `Full-Stack Inventory Management`.

### Step 1: Start Backend Server (Terminal 1)
Open a terminal in VS Code (`Ctrl + ~` or `Terminal -> New Terminal`):

```bash
cd server
npm start
```
* The backend server will start and listen on **`http://localhost:5000`**
* *(Ensure MongoDB is running locally on port 27017)*

---

### Step 2: Start Frontend Client (Terminal 2)
Click the **`+`** icon in the VS Code terminal panel to split/open a **second terminal**:

```bash
cd client
npm run dev
```
* The Vite frontend will start and output a local URL: **`http://localhost:5173`**
* Hold `Ctrl` and click the link (or open `http://localhost:5173` in your browser).

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user (Admin or User)
- `POST /api/auth/login` - Login user
- `GET /api/auth/users` - Get all users (Admin only)

### Products
- `GET /api/products` - Get all inventory products
- `GET /api/products/:id` - Get specific product details
- `POST /api/products` - Add product (Admin only)
- `PUT /api/products/:id` - Edit product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Orders & Tracking
- `POST /api/orders` - Place order (Validates and deducts stock)
- `GET /api/orders/my` - Get logged-in user's orders
- `GET /api/orders` - Get all orders (Admin only)
- `GET /api/orders/notifications` - Get delivery notifications
- `PUT /api/orders/:id/status` - Update delivery status (Admin only)
- `PUT /api/orders/:id/cancel` - Cancel order & restore stock
