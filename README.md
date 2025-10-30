# Leisure Club Management System

A comprehensive web application for managing leisure club memberships, facility bookings, and administrative operations.

## Features

### Core Functionality
- **User Authentication & Authorization** - Secure login system with role-based access control
- **Membership Management** - Apply, renew, and manage memberships
- **Facility Booking System** - Real-time booking with conflict prevention
- **Payment Processing** - Integrated payment gateway for transactions
- **Audit Trail** - Complete logging for compliance and security
- **Admin Dashboard** - Comprehensive reporting and system management

### User Roles
- **Members** - Book facilities, manage profiles, view booking history
- **Staff** - Manage bookings, assist members, generate reports
- **Admins** - Full system access, user management, configuration
- **Guests** - Browse facilities and initiate registration

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **Joi** - Data validation
- **Bcrypt** - Password hashing

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Toastify** - Notifications
- **Styled Components** - CSS-in-JS

### Security Features
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Secure password hashing

## Project Structure

```
leisure-club/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── database/        # Database configuration
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── package.json
├── CLAUDE.md
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Database Setup

1. **Install PostgreSQL** and create a database:
   ```sql
   CREATE DATABASE leisure_club;
   ```

2. **Create a database user** (optional):
   ```sql
   CREATE USER leisureclub_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE leisure_club TO leisureclub_user;
   ```

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=leisure_club
   DB_USER=leisureclub_user
   DB_PASSWORD=your_password
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server**:
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## Default Credentials

After running migrations, you can use these default credentials:

**Admin Account:**
- Email: `admin@leisureclub.com`
- Password: `admin123`

**Member Account:** (You'll need to register one through the UI)

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Facility Endpoints
- `GET /api/facilities` - List all facilities
- `GET /api/facilities/:id` - Get facility details
- `GET /api/facilities/:id/availability` - Check availability
- `POST /api/facilities` - Create facility (admin/staff only)

### Booking Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/:id` - Get booking details
- `DELETE /api/bookings/:id` - Cancel booking

### Admin Endpoints
- `GET /api/bookings/admin/all` - List all bookings
- `PUT /api/bookings/:id/status` - Update booking status
- `GET /api/bookings/admin/stats` - Get booking statistics

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality
The project includes ESLint and Prettier configurations for consistent code formatting.

### Database Schema
The database schema includes comprehensive audit logging, foreign key constraints, and indexes for optimal performance. See `backend/src/database/schema.sql` for the complete schema.

## Deployment

### Production Build

1. **Build frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Backend production**:
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment (Coming Soon)
Docker configuration will be added for easy deployment.

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens have configurable expiration
- Input validation on all API endpoints
- SQL injection prevention through parameterized queries
- Rate limiting on API endpoints
- CORS configuration for cross-origin requests
- Secure file upload handling (when implemented)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## Roadmap

- [ ] Mobile application (React Native)
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email/SMS notifications
- [ ] Advanced reporting dashboard
- [ ] Multi-language support
- [ ] Mobile-responsive design improvements
- [ ] Integration with access control systems
- [ ] Membership card printing
- [ ] Advanced scheduling features