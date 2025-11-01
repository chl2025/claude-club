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
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing

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

## Current Deployment Configuration

### Architecture Overview
- **Cloud Server**: Running on private IP with NAT routing
- **Public Access**: Via DNS name (e.g., `your-domain.com`)
- **Network Setup**: Public IP → NAT → Private IP → Server
- **Direct Connection**: No proxy/reverse proxy (nginx stopped to avoid conflicts)

### Server Configuration
- **Frontend**: React development server on port 3000
- **Backend**: Node.js/Express server on port 5000
- **Database**: PostgreSQL on default port 5432
- **API Access**: Direct connection to `http://your-domain.com:5000/api`

### Current Settings

#### Frontend Configuration (`frontend/src/services/api.js`)
```javascript
const API_BASE_URL = 'http://your-domain.com:5000/api';
```

#### Backend Configuration (`backend/src/app.js`)
- **CORS Origins**: `['http://localhost:3000', 'http://localhost:3001', 'http://your-domain.com:3000']`
- **Listening**: `0.0.0.0:5000` (all interfaces)
- **Environment**: Development

#### Logging Configuration
- **Access Log**: Console output with enhanced request/response logging
- **Error Log**: Console output with detailed error information
- **Request Details**: Timestamp, method, path, IP, headers, response time

### Important Notes

#### nginx Configuration Issue
- **Problem**: nginx proxy headers conflict with backend security middleware (Helmet.js + CORS)
- **Solution**: nginx service should be stopped for direct API access
- **Location**: `/etc/nginx/sites-available/cntv` was conflicting with direct connections
- **Current Status**: nginx stopped to allow direct frontend-backend communication

#### Network Security
- **Backend**: Only accessible via API endpoints, no direct database exposure
- **Frontend**: Served via development server with direct API calls
- **CORS**: Configured to allow legitimate origins only

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
   npm start
   ```

   The API will be available at `http://your-domain.com:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Remove proxy configuration** (if present):
   Ensure `package.json` does not contain a proxy field that might interfere with direct API access.

4. **Start the frontend development server**:
   ```bash
   npm start
   ```

   The application will be available at `http://your-domain.com:3000`

## Access & URL Configuration

### Public URLs
- **Frontend**: `http://your-domain.com:3000`
- **Backend API**: `http://your-domain.com:5000/api`
- **Health Check**: `http://your-domain.com:5000/api/health`

### Local Development URLs (if needed)
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`

## Default Credentials

After running migrations, you can register new accounts through the web interface. The system does not include pre-configured admin accounts for security reasons.

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

### Health Check Endpoints
- `GET /api/health` - Service health check
- `GET /api/health/db` - Database connectivity check

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

## Troubleshooting

### Common Issues

#### Connection Refused Errors
- **Check**: Ensure backend is running on port 5000
- **Verify**: API URL in frontend matches server configuration
- **Network**: Confirm DNS resolution and firewall settings
- **nginx**: Ensure nginx is stopped if proxy conflicts occur

#### CORS Issues
- **Origin**: Ensure frontend origin is in backend CORS whitelist
- **Headers**: Check for conflicting proxy headers from nginx
- **Direct**: Use direct connection without reverse proxy

#### Database Connection
- **Credentials**: Verify database credentials in `.env`
- **Service**: Ensure PostgreSQL service is running
- **Network**: Check database accessibility from backend

### Log Locations

#### Backend Logging
- **Access Log**: Console output (configured with enhanced request/response logging)
- **Error Log**: Console output with detailed error information
- **Request Details**: Timestamp, method, path, IP, headers, response time
- **Database Logs**: PostgreSQL system logs (location varies by OS)

#### Frontend Logging
- **Development Log**: Browser console during development
- **Build Log**: Terminal output during `npm run build`
- **Error Reporting**: Browser console for runtime errors

#### Database Logs
- **PostgreSQL Logs**: `/var/log/postgresql/` (location varies by OS and PostgreSQL version)
- **Database Connection Logs**: Included in backend console output

### Enhanced Backend Logging
The backend includes comprehensive logging that displays:
- Request timestamp, method, path, and IP address
- Complete request headers for debugging
- Response status codes and timing
- Detailed error information with stack traces (development mode)
- Database connection status

## Production Deployment

### Considerations
1. **Reverse Proxy**: Configure nginx or Apache properly for production
2. **Environment**: Set `NODE_ENV=production` for production
3. **Database**: Use production-grade PostgreSQL configuration
4. **Security**: Configure proper SSL/TLS certificates
5. **Monitoring**: Implement proper logging and monitoring
6. **Process Management**: Use PM2 or similar for process management

### Production Build

1. **Build frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Backend production**:
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens have configurable expiration
- Input validation on all API endpoints
- SQL injection prevention through parameterized queries
- Rate limiting on API endpoints
- CORS configuration for cross-origin requests
- Security headers via Helmet.js
- No proxy configuration conflicts (nginx stopped)

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
- [ ] Production-ready nginx configuration
- [ ] Docker containerization
- [ ] Automated testing pipeline