# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a leisure club management web application project in its initial planning phase. The project aims to create a comprehensive web-based platform for managing club memberships, facility bookings, transactions, and administrative operations.

## Current State

The repository currently contains only a comprehensive Software Requirements Specification (SRS) document (`Software-Requirement-Specification.md`) that defines the complete system architecture, requirements, and implementation guidelines.

## Key Architecture

The system is planned to follow a three-tier architecture:

- **Frontend**: React-based responsive web interface
- **Backend/API**: Node.js or Python-based RESTful API services
- **Database**: PostgreSQL or MySQL relational database

### Core Modules

1. **Membership Management** - User registration, authentication, profile management
2. **Facilities & Booking** - Real-time facility reservations with conflict prevention
3. **Transaction Management** - Payment processing, refunds, financial reporting
4. **Audit Trail** - Immutable logging for compliance and security
5. **Communication** - Email/SMS notifications and messaging
6. **User Administration** - Role-based access control (RBAC)

### User Roles

- **Members**: Self-service account management, bookings, view own transactions
- **Staff**: Booking assistance, member registration, limited admin access
- **Admins**: Full system access, reporting, configuration, audit capabilities
- **Guests**: Browse facilities, initiate registration

## Technology Stack Recommendations

Based on the SRS requirements:
- **Frontend**: React with responsive design, WCAG 2.1 AA accessibility
- **Backend**: Node.js/Express or Python/Django with stateless API design
- **Database**: PostgreSQL with strong transaction support and audit capabilities
- **Authentication**: Multi-factor auth for admin/staff, bcrypt/Argon2 password hashing
- **Security**: TLS 1.2+, AES-256 encryption, OWASP Top 10 compliance
- **Deployment**: Docker/Kubernetes, cloud-native (AWS/Azure/GCP)

## Development Guidelines

### Security Priorities
- Implement RBAC strictly with server-side enforcement
- All user input must be validated and sanitized
- Use parameterized queries/ORM to prevent SQL injection
- Encrypt all sensitive data at rest and in transit
- Maintain immutable audit logs for all critical actions

### Performance Requirements
- Response times <2 seconds for 95% of actions
- Support 5,000+ concurrent sessions
- Process 100+ booking transactions per minute
- 99.9% uptime availability

### Data Integrity
- Prevent double-booking with real-time availability checks
- Maintain transaction consistency across membership and booking operations
- Shadow tables or generic audit logs for compliance
- GDPR/CCPA compliant data handling

## Implementation Considerations

1. **Audit Trail Design**: Use shadow tables or generic audit tables with triggers on key entities (Bookings, Transactions, Memberships)
2. **Booking System**: Implement optimistic locking or database constraints to prevent overlapping reservations
3. **Payment Integration**: Design for multiple payment gateway integrations with secure token handling
4. **Scalability**: Stateless API servers behind load balancers, database sharding support
5. **Testing**: Comprehensive security testing, load testing for 5,000+ concurrent users
6. **Monitoring**: Real-time error logging, health checks, performance metrics

## Next Steps for Development

1. Set up project structure with separate frontend/backend repositories
2. Implement database schema with audit trail capabilities
3. Create authentication and authorization middleware
4. Develop core booking engine with conflict prevention
5. Integrate payment gateway services
6. Build responsive member dashboard
7. Implement admin reporting interface

## Compliance & Standards

The system must comply with:
- ISO/IEC/IEEE 29148:2018 for requirements
- OWASP Top 10 security practices
- WCAG 2.1 AA accessibility
- GDPR/CCPA data protection
- Financial audit requirements for transaction data

This SRS provides the foundation for building a secure, scalable, and user-friendly leisure club management platform that can handle complex booking scenarios while maintaining data integrity and compliance.