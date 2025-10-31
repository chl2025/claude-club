# Leisure Club Backend API Documentation

## Server Configuration
- **Base URL**: `http://localhost:5000`
- **Environment**: Development
- **Database**: PostgreSQL

## Authentication
- **Method**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`

## API Endpoints

### 🔐 Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | ❌ No |
| POST | `/api/auth/login` | User login | ❌ No |
| GET | `/api/auth/profile` | Get user profile | ✅ Yes |
| PUT | `/api/auth/profile` | Update user profile | ✅ Yes |
| PUT | `/api/auth/change-password` | Change password | ✅ Yes |
| POST | `/api/auth/logout` | User logout | ✅ Yes |

#### Register Request Body:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login Request Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 🏢 Facilities Routes (`/api/facilities`)

| Method | Endpoint | Description | Auth Required | Staff/Admin |
|--------|----------|-------------|---------------|-------------|
| GET | `/api/facilities` | Get all facilities | ✅ Yes | ❌ No |
| GET | `/api/facilities/types` | Get facility types | ✅ Yes | ❌ No |
| GET | `/api/facilities/:id` | Get facility by ID | ✅ Yes | ❌ No |
| GET | `/api/facilities/:id/availability` | Check facility availability | ✅ Yes | ❌ No |
| GET | `/api/facilities/:id/available-slots` | Get available time slots | ✅ Yes | ❌ No |
| POST | `/api/facilities` | Create new facility | ✅ Yes | ✅ Yes |
| PUT | `/api/facilities/:id` | Update facility | ✅ Yes | ✅ Yes |
| DELETE | `/api/facilities/:id` | Delete facility | ✅ Yes | ✅ Yes |
| PUT | `/api/facilities/:id/status` | Update facility status | ✅ Yes | ✅ Yes |
| GET | `/api/facilities/admin/utilization` | Get facility utilization stats | ✅ Yes | ✅ Yes |

#### Create Facility Request Body:
```json
{
  "name": "Tennis Court 1",
  "type": "tennis_court",
  "description": "Outdoor tennis court",
  "capacity": 4,
  "location": "Court Area A",
  "operatingHoursStart": "06:00",
  "operatingHoursEnd": "22:00",
  "bookingDurationMinutes": 60,
  "requiresSupervision": false
}
```

### 📅 Bookings Routes (`/api/bookings`)

| Method | Endpoint | Description | Auth Required | Staff/Admin |
|--------|----------|-------------|---------------|-------------|
| POST | `/api/bookings` | Create new booking | ✅ Yes | ❌ No |
| GET | `/api/bookings` | Get user's bookings | ✅ Yes | ❌ No |
| GET | `/api/bookings/:id` | Get booking by ID | ✅ Yes | ❌ No |
| DELETE | `/api/bookings/:id` | Cancel booking | ✅ Yes | ❌ No |
| GET | `/api/bookings/facilities/:facilityId/availability` | Check facility availability for booking | ✅ Yes | ❌ No |
| GET | `/api/bookings/admin/all` | Get all bookings (admin) | ✅ Yes | ✅ Yes |
| PUT | `/api/bookings/:id/status` | Update booking status (admin) | ✅ Yes | ✅ Yes |
| GET | `/api/bookings/admin/stats` | Get booking statistics (admin) | ✅ Yes | ✅ Yes |

#### Create Booking Request Body:
```json
{
  "facilityId": "uuid-of-facility",
  "startTime": "2025-10-31T10:00:00Z",
  "endTime": "2025-10-31T11:00:00Z",
  "notes": "Optional notes"
}
```

### 🏥 Health Check Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Server health check | ❌ No |
| GET | `/api/health/db` | Database health check | ❌ No |

## Response Formats

### Success Response:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Validation Error Response:
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
| `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response**: `429 Too Many Requests`

## Security Features
- Helmet.js security headers
- CORS configuration
- Input validation with express-validator
- JWT authentication
- Role-based access control
- SQL injection prevention
- Password hashing with bcrypt