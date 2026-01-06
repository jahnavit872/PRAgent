# PRAgentS Ecommerce

A full-stack ecommerce application built with Node.js, Express, and vanilla JavaScript.

## Features

✨ **Product Management**
- Browse products with images and details
- Search and filter products
- Real-time stock updates

🛒 **Shopping Cart**
- Add/remove items from cart
- Update quantities
- Persistent cart per user

👤 **User Authentication**
- User registration and login
- JWT-based authentication
- Secure password hashing with bcrypt

📦 **Order Management**
- Checkout with shipping details
- Order history tracking
- Multiple payment methods

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
# Copy the example env file
cp .env.example .env
```

3. Update `.env` file with your configuration (especially JWT_SECRET for production)

### Running the Application

```bash
# Start the server
npm start

# Or run with auto-reload (development)
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
PRAgentS/
├── src/
│   ├── server.js              # Express server setup
│   ├── routes/                # API routes
│   │   ├── products.js        # Product endpoints
│   │   ├── cart.js            # Cart endpoints
│   │   ├── auth.js            # Authentication endpoints
│   │   └── orders.js          # Order endpoints
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── utils/
│   │   └── storage.js         # Data storage utilities
│   └── data/
│       └── store.json         # JSON database (auto-generated)
├── public/                    # Frontend files
│   ├── index.html             # Homepage
│   ├── products.html          # Products page
│   ├── cart.html              # Shopping cart
│   ├── login.html             # Login/Register page
│   ├── orders.html            # Order history
│   ├── css/
│   │   └── style.css          # Application styles
│   └── js/
│       ├── app.js             # Global utilities
│       ├── products.js        # Products page logic
│       ├── cart.js            # Cart page logic
│       ├── auth.js            # Authentication logic
│       └── orders.js          # Orders page logic
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/search/:query` - Search products

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Cart (requires authentication)
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update item quantity
- `DELETE /api/cart/remove/:productId` - Remove item
- `DELETE /api/cart/clear` - Clear cart

### Orders (requires authentication)
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order from cart

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Products**: View available products on the products page
3. **Add to Cart**: Click "Add to Cart" on products you want to purchase
4. **Checkout**: Go to cart and proceed to checkout
5. **View Orders**: Check your order history on the orders page

## Data Storage

This application uses JSON file-based storage for simplicity. In production, consider migrating to a proper database like:
- MongoDB
- PostgreSQL
- MySQL

## Security Notes

- Change `JWT_SECRET` in `.env` for production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Consider using a production-grade session store

## Future Enhancements

- Add product reviews and ratings
- Implement admin dashboard
- Add product categories and filters
- Include payment gateway integration
- Add email notifications
- Implement wishlist functionality
- Add product image upload
- Mobile responsive improvements

## License

ISC

