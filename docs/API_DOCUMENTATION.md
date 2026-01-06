# Pocket CRM - API Documentation

## 📡 API Overview

**Base URL:** `https://{projectId}.supabase.co/functions/v1/make-server-a2294ced`

**Authentication:** Bearer token in Authorization header  
**Content-Type:** `application/json`  
**API Version:** 1.0.0

---

## 🔐 Authentication

### Headers Required
```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Public Routes (No Auth Required)
- `/signup` - User registration
- `/login` - User login (handled by Supabase)

### Protected Routes (Auth Required)
All other routes require valid access token

---

## 📋 API Response Format

### Success Response
```typescript
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```typescript
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly error description"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔑 Key-Value Store API

The KV Store provides a flexible storage solution for all data.

### Get Single Value
```typescript
GET /kv/{key}

Response:
{
  "success": true,
  "data": {
    "key": "user_123_aftersales",
    "value": {...},
    "userId": "123",
    "createdAt": "2024-12-02T10:00:00Z",
    "updatedAt": "2024-12-02T10:00:00Z"
  }
}
```

### Get Multiple Values
```typescript
POST /kv/mget
Body: {
  "keys": ["key1", "key2", "key3"]
}

Response:
{
  "success": true,
  "data": [
    { "key": "key1", "value": {...} },
    { "key": "key2", "value": {...} }
  ]
}
```

### Get by Prefix
```typescript
GET /kv/prefix/{prefix}

Example: GET /kv/prefix/user_123_

Response:
{
  "success": true,
  "data": [
    { "key": "user_123_aftersales", "value": {...} },
    { "key": "user_123_kpi", "value": {...} }
  ]
}
```

### Set Single Value
```typescript
POST /kv/set
Body: {
  "key": "user_123_aftersales",
  "value": {...}
}

Response:
{
  "success": true,
  "message": "Value set successfully"
}
```

### Set Multiple Values
```typescript
POST /kv/mset
Body: {
  "items": [
    { "key": "key1", "value": {...} },
    { "key": "key2", "value": {...} }
  ]
}

Response:
{
  "success": true,
  "message": "Values set successfully"
}
```

### Delete Value
```typescript
DELETE /kv/{key}

Response:
{
  "success": true,
  "message": "Value deleted successfully"
}
```

### Delete Multiple Values
```typescript
POST /kv/mdel
Body: {
  "keys": ["key1", "key2"]
}

Response:
{
  "success": true,
  "message": "Values deleted successfully"
}
```

---

## 👥 User Management API

### Sign Up
```typescript
POST /signup
Body: {
  "phone": "1234567890",
  "countryCode": "+1",
  "password": "SecurePass123",
  "name": "John Doe",
  "inviteCode": "INVITE123" // optional
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+1 1234567890",
      "name": "John Doe",
      "role": "member"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

### Get User Profile
```typescript
GET /user/profile
Headers: { Authorization: Bearer {access_token} }

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+1 1234567890",
    "role": "admin",
    "companyName": "Acme Corp",
    "companyLogo": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update User Profile
```typescript
PUT /user/profile
Headers: { Authorization: Bearer {access_token} }
Body: {
  "name": "John Doe",
  "companyName": "Acme Corp",
  "companyLogo": "data:image/png;base64,..."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    // ... updated user data
  }
}
```

---

## 📊 Module-Specific Endpoints

### After-Sales Follow-up

#### Create Follow-up Record
```typescript
POST /aftersales
Body: {
  "customerName": "Jane Smith",
  "productService": "Product X",
  "purchaseDate": "2024-01-15",
  "lastContact": "2024-02-01",
  "nextFollowUp": "2024-02-15",
  "status": "excellent",
  "notes": "Customer is very satisfied"
}
```

#### Get All Follow-ups
```typescript
GET /aftersales?userId={userId}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customerName": "Jane Smith",
      // ... other fields
    }
  ]
}
```

#### Update Follow-up
```typescript
PUT /aftersales/{id}
Body: {
  "status": "needs-attention",
  "notes": "Follow up required"
}
```

#### Delete Follow-up
```typescript
DELETE /aftersales/{id}
```

---

### KPI Tracking

#### Create KPI
```typescript
POST /kpi
Body: {
  "kpiName": "Monthly Sales",
  "target": 100000,
  "actual": 95000,
  "unit": "USD",
  "period": "2024-02",
  "status": "on-track",
  "notes": "Trending well"
}
```

#### Get KPIs
```typescript
GET /kpi?userId={userId}&period={period}
```

---

### Competitor Intelligence

#### Create Competitor Entry
```typescript
POST /competitors
Body: {
  "competitorName": "Competitor Inc",
  "productService": "Similar Product",
  "pricing": "$99/month",
  "strengths": "Strong brand",
  "weaknesses": "Limited support",
  "marketPosition": "Strong",
  "threatLevel": "high"
}
```

#### Get Competitors
```typescript
GET /competitors?userId={userId}
```

---

### Sales Strategies

#### Create Strategy
```typescript
POST /strategies
Body: {
  "strategyName": "Q1 Campaign",
  "targetAudience": "Small businesses",
  "channels": "Email, Social Media",
  "budget": 50000,
  "expectedROI": 150000,
  "status": "active",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31"
}
```

#### Get Strategies
```typescript
GET /strategies?userId={userId}
```

---

### Debt Collection

#### Create Debt Record
```typescript
POST /debt
Body: {
  "customerName": "ABC Corp",
  "invoiceNumber": "INV-2024-001",
  "amount": 5000,
  "dueDate": "2024-01-31",
  "status": "overdue",
  "contactAttempts": 2,
  "notes": "Payment plan negotiated"
}
```

#### Get Debt Records
```typescript
GET /debt?userId={userId}&status={status}
```

#### Update Debt Status
```typescript
PUT /debt/{id}
Body: {
  "status": "paid",
  "notes": "Payment received"
}
```

---

### Task Management

#### Create Task
```typescript
POST /tasks
Body: {
  "title": "Follow up with client",
  "description": "Discuss renewal",
  "dueDate": "2024-02-15",
  "priority": "high",
  "status": "pending",
  "category": "sales",
  "tags": ["client", "renewal"]
}
```

#### Get Tasks
```typescript
GET /tasks?userId={userId}&status={status}&priority={priority}
```

#### Update Task
```typescript
PUT /tasks/{id}
Body: {
  "status": "completed",
  "completedAt": "2024-02-14T15:30:00Z"
}
```

---

## 📈 Analytics & Reports API

### Generate AI Report
```typescript
POST /reports/generate
Body: {
  "type": "quick", // or "full"
  "title": "Monthly Performance Report",
  "includeModules": ["aftersales", "kpi", "debt"]
}

Response:
{
  "success": true,
  "data": {
    "id": "report_uuid",
    "type": "quick",
    "title": "Monthly Performance Report",
    "content": "AI-generated content...",
    "insights": [
      {
        "module": "aftersales",
        "insights": [
          "Customer satisfaction improved by 15%",
          "Response time decreased by 20%"
        ]
      }
    ],
    "createdAt": "2024-02-01T10:00:00Z"
  }
}
```

### Get Reports
```typescript
GET /reports?userId={userId}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "full",
      "title": "Q1 Report",
      "status": "processed",
      "createdAt": "2024-01-31T10:00:00Z"
    }
  ]
}
```

### Get Single Report
```typescript
GET /reports/{id}
```

### Delete Report
```typescript
DELETE /reports/{id}
```

---

## 🔍 Search & Filter API

### Universal Search
```typescript
GET /search?q={query}&modules={modules}&userId={userId}

Example: GET /search?q=smith&modules=aftersales,debt&userId=123

Response:
{
  "success": true,
  "data": {
    "aftersales": [
      { "id": "1", "customerName": "John Smith", ... }
    ],
    "debt": [
      { "id": "2", "customerName": "Jane Smith", ... }
    ]
  }
}
```

### Advanced Filters
```typescript
POST /filter
Body: {
  "module": "aftersales",
  "filters": {
    "status": ["excellent", "good"],
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-02-01"
    }
  },
  "sort": {
    "field": "lastContact",
    "order": "desc"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

---

## 💾 Bulk Operations API

### Bulk Create
```typescript
POST /bulk/create
Body: {
  "module": "aftersales",
  "records": [
    { "customerName": "Customer 1", ... },
    { "customerName": "Customer 2", ... }
  ]
}

Response:
{
  "success": true,
  "data": {
    "created": 10,
    "failed": 0,
    "errors": []
  }
}
```

### Bulk Update
```typescript
POST /bulk/update
Body: {
  "module": "tasks",
  "ids": ["id1", "id2", "id3"],
  "updates": {
    "status": "completed"
  }
}
```

### Bulk Delete
```typescript
POST /bulk/delete
Body: {
  "module": "debt",
  "ids": ["id1", "id2"]
}
```

---

## 📤 Export API

### Export to Excel
```typescript
POST /export/excel
Body: {
  "module": "aftersales",
  "filters": {...},
  "columns": ["customerName", "status", "lastContact"]
}

Response: (File download)
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="aftersales_export.xlsx"
```

### Export to PDF
```typescript
POST /export/pdf
Body: {
  "reportId": "uuid"
}

Response: (File download)
Content-Type: application/pdf
Content-Disposition: attachment; filename="report.pdf"
```

---

## ⚠️ Error Codes

### Client Errors (4xx)
- `400` - Invalid request parameters
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Resource not found
- `409` - Conflict (duplicate entry)
- `422` - Validation error

### Server Errors (5xx)
- `500` - Internal server error
- `503` - Service unavailable

### Custom Error Codes
```typescript
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "constraint": "must be valid email"
  }
}
```

---

## 🔒 Security

### Rate Limiting
- **Login attempts:** 5 per 15 minutes
- **API calls:** 100 per minute per user
- **Report generation:** 10 per hour

### Data Validation
- All inputs sanitized
- SQL injection protection via parameterized queries
- XSS protection via output encoding
- CSRF protection via tokens

### Authentication Flow
```
1. User submits credentials
2. Server validates with Supabase Auth
3. Server generates JWT token
4. Client stores token securely
5. Client includes token in subsequent requests
6. Server validates token on each request
```

---

## 🧪 Testing the API

### Using cURL
```bash
# Get user profile
curl -X GET \
  https://your-project.supabase.co/functions/v1/make-server-a2294ced/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch)
```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/make-server-a2294ced/aftersales',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerName: 'John Doe',
      // ... other fields
    })
  }
);

const data = await response.json();
```

---

## 📝 Best Practices

### API Usage
1. **Always include error handling** in your requests
2. **Use debouncing** for search inputs
3. **Implement retry logic** for failed requests
4. **Cache responses** when appropriate
5. **Use optimistic updates** for better UX

### Performance
1. **Batch requests** when possible (use bulk operations)
2. **Paginate large datasets**
3. **Filter on the server** rather than client
4. **Use compression** (gzip) for large payloads

### Security
1. **Never log sensitive data**
2. **Rotate tokens regularly**
3. **Use HTTPS only**
4. **Validate all inputs**
5. **Handle errors gracefully** without exposing internals

---

## 🔄 Versioning

Current API Version: **v1.0.0**

### Version History
- `v1.0.0` (2024-12-02) - Initial production release

### Breaking Changes Policy
- Major version bump for breaking changes
- Deprecation notices 90 days in advance
- Legacy version support for 6 months

---

## 📞 Support

For API issues or questions:
- Check error responses for detailed messages
- Review code examples in documentation
- Ensure proper authentication headers
- Verify request body format

---

*Last Updated: December 2024*  
*API Version: 1.0.0*  
*Status: Production* ✅
