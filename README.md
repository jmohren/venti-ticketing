# ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Backend Configuration (unified endpoint for auth and data)
VITE_BACKEND_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=morning_routine
```

### Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔐 Cookie-Based Authentication Architecture

### Secure Cookie-Only Authentication

This application implements **enterprise-grade cookie-based authentication** with:

- ✅ **HttpOnly Cookies**: Secure authentication cookies that prevent XSS attacks
- ✅ **Automatic CSRF Protection**: Built-in protection against cross-site request forgery
- ✅ **No Token Storage**: No tokens stored in localStorage or memory - fully cookie-based
- ✅ **Automatic Session Management**: Browser handles all authentication automatically
- ✅ **Session Refresh**: Transparent session renewal with refresh-retry pattern
- ✅ **Auto-Refresh Cycle**: Maintains active sessions with 10-minute refresh intervals

### Key Components

#### 1. AuthApiClient Class (`src/api/auth/AuthApiClient.ts`)
```typescript
// Cookie-based authentication service
class AuthApiClient {
  // No token storage - cookies handle everything!
  
  async login(email, password) {
    // Server sets HttpOnly cookies automatically
    // Returns user info only (no tokens)
  }
  
  async apiRequest(url, options) {
    // All requests use credentials: 'include'
    // No Authorization headers needed
    // Automatic refresh-retry on 401
  }
}
```

#### 2. React Hook Wrapper
```typescript
const { login, logout, authenticatedFetch, isAuthenticated } = useAuth();

// Login - cookies set automatically
await login(email, password);

// Make authenticated API calls - cookies sent automatically
const response = await authenticatedFetch('/rest/morning_routine/work_lines');
```

### Cookie-Based Authentication Flow

#### 1. Login Flow
- User submits credentials
- Server validates and sets secure HttpOnly cookies
- No tokens in response body
- Frontend receives user info only

#### 2. Session Management
- All API requests use `credentials: 'include'`
- Browser automatically sends cookies
- No Authorization headers needed
- No manual token storage required

#### 3. Protected Endpoints
- Authentication via cookies only
- Role-based access control built-in
- 401 = session expired → try refresh → retry request
- 403 = insufficient permissions → show access denied

### API Response Patterns

#### Success Responses
- **200**: Authenticated request successful
- **201**: Resource created successfully  

#### Error Responses
- **401**: Session expired → Try refresh, then retry original request
- **403**: Insufficient permissions → Show access denied message
- **400**: Bad request → Show validation errors
- **500**: Server error → Show generic error

### Session Lifecycle

1. **Login** → Cookies set automatically by server
2. **API Calls** → Cookies sent automatically with `credentials: 'include'`
3. **Session Expires** → 401 response → Call `/auth/refresh` → Retry original request
4. **Refresh Success** → Continue with original request
5. **Refresh Fails** → Redirect to login
6. **Logout** → Cookies cleared automatically by server

### Usage in Components

#### Basic API Calls
```typescript
const { authenticatedFetch } = useAuth();

// All API calls automatically include cookies
const workLines = await authenticatedFetch('/rest/morning_routine/work_lines');
const data = await workLines.json();
```

#### Advanced Usage with withAuth
```typescript
const { withAuth } = useAuth();

// Direct access to AuthApiClient for complex operations
const result = await withAuth(async (apiRequest) => {
  const users = await apiRequest('/rest/morning_routine/users');
  const userData = await users.json();
  
  // Make multiple related calls
  const roles = await apiRequest('/rest/morning_routine/roles');
  return { users: userData, roles: await roles.json() };
});
```

### Error Handling

The authentication system automatically handles:
- **Token Expiration**: No tokens used - cookie-based only
- **401 Responses**: Attempts refresh + retry automatically  
- **Session Expiry**: Redirects to login when refresh fails
- **403 Responses**: Shows access denied without retry

```typescript
try {
  const response = await authenticatedFetch('/rest/morning_routine/data');
  const data = await response.json();
} catch (error) {
  if (error.message === 'Session expired') {
    // User will be redirected to login automatically
  }
  if (error.message === 'Access denied - insufficient permissions') {
    // Show access denied message
  }
}
```

### Security Features

- **HttpOnly Cookies**: Prevent XSS attacks - cookies invisible to JavaScript
- **Automatic CSRF Protection**: Built into cookie-based authentication
- **Secure Cookie Transmission**: Cookies sent only over HTTPS in production
- **Session Rotation**: Automatic session refresh for security
- **No Token Management**: Eliminates all client-side token storage risks

### Key Implementation Notes

- Always use `credentials: 'include'` in fetch requests
- No token storage required - cookies are HttpOnly and automatic
- Handle 401s with refresh-retry pattern before redirecting to login
- CORS must allow credentials for cookie-based auth to work
- Auto-refresh every 10 minutes to maintain active sessions

## 📁 Project Structure

```
src/
├── auth/
│   └── useAuthenticatedApi.ts # Cookie-based authentication service
├── config/
│   └── appConfig.ts          # Environment configuration
├── api/
│   └── apiClient.ts          # API client using cookie auth
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx     # Cookie-based login interface
│   └── ProtectedRoute.tsx    # Route protection
└── App.tsx                   # Session initialization
```

## 🔧 Key Features

### Authentication Flow
1. **Login**: Server sets HttpOnly cookies automatically
2. **API Calls**: Browser sends cookies automatically with all requests
3. **Session Refresh**: Transparent renewal with automatic retry
4. **Logout**: Server clears cookies automatically

### Security Features
- **HttpOnly Cookies**: XSS-proof authentication storage
- **Automatic CSRF Protection**: Built-in cross-site request forgery protection
- **No Client Storage**: Zero risk from client-side token storage
- **Session Rotation**: Regular session refresh for enhanced security

### Developer Experience
- **Zero Token Management**: No manual token handling required
- **Automatic Retry**: Built-in refresh-retry pattern for expired sessions
- **Simple API**: Clean, straightforward authentication interface
- **Type Safety**: Full TypeScript support with proper interfaces

This cookie-based authentication provides enterprise-grade security while eliminating all the complexity of manual token management.

## 🛠️ Development Guidelines

### Adding New API Endpoints

1. **For PostgREST operations**, use the service functions:
```typescript
import { getWorkLines, updateSQDIStatus } from '../data/postgrestService';

// Use with authenticated fetch
const { authenticatedFetch } = useAuth();
const workLines = await getWorkLines(authenticatedFetch);
```

2. **For custom backend endpoints**, use authenticatedFetch directly:
```typescript
const response = await authenticatedFetch('/custom/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Configuration Management

All configuration is centralized in `src/config/appConfig.ts`. Uses environment variables:
- `VITE_BACKEND_URL` - Backend API endpoint
- `VITE_APP_NAME` - App name for PostgREST paths

### Error Handling

The authentication system provides comprehensive error handling with automatic token refresh on 401 responses.

## 🚀 Deployment

### Environment Variables

Set these in your deployment environment:
- `VITE_BACKEND_URL` - Your FastAPI backend URL
- `VITE_APP_NAME` - App identifier (defaults to 'morning_routine')

### Backend Requirements

Your FastAPI backend should provide:
- `POST /auth/login` - Login endpoint
- `POST /auth/logout` - Logout endpoint  
- `POST /auth/refresh` - Token refresh endpoint
- `GET/POST/PATCH/DELETE /rest/{app}/{table}` - PostgREST proxy endpoints

## 📊 API Endpoints

The application integrates with PostgREST through the unified backend:

- **Work Lines**: `/rest/morning_routine/work_lines`
- **SQDI Incidents**: `/rest/morning_routine/sqdi_incidents`
- **PDCA Entries**: `/rest/morning_routine/pdca_entries`
- **People**: `/rest/morning_routine/people`
- **Attendance**: `/rest/morning_routine/attendance`

## 🔍 Troubleshooting

### Authentication Issues

1. **Check backend endpoint** is accessible
2. **Verify CORS configuration** allows your frontend domain
3. **Review browser console** for cookie/auth errors
4. **Ensure environment variables** are set correctly

### API Issues

1. **Verify backend URL** in configuration
2. **Check network tab** for failed requests
3. **Review cookie settings** in browser dev tools
4. **Validate backend health** at `/health` or similar

## 🤝 Contributing

1. Follow **security best practices** for authentication
2. **Add types** for all new interfaces
3. **Test authentication flows** thoroughly

## 📄 License

This project is licensed under the MIT License.




\d morning_routine.*