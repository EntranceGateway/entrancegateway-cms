# Admin Purchase Management API Documentation

## Base URL
```
/api/v1/admin/purchases
```

## Access
```
Authorization: Bearer {token}
Access: ADMIN, SUPER_ADMIN
```

---

## Table of Contents
1. [Get All Purchases](#1-get-all-purchases)
2. [Get Pending Approvals](#2-get-pending-approvals)
3. [Get Purchases by Module Type](#3-get-purchases-by-module-type)
4. [Get Training Purchases](#4-get-training-purchases)
5. [Get Subscription Purchases](#5-get-subscription-purchases)
6. [Get Quiz Purchases](#6-get-quiz-purchases)
7. [Get Purchase Statistics](#7-get-purchase-statistics)
8. [Approve Purchase](#8-approve-purchase)
9. [Reject Purchase](#9-reject-purchase)
10. [Admin Payment Processing](#10-admin-payment-processing)
11. [Request/Response Schemas](#11-requestresponse-schemas)
12. [Enums Reference](#12-enums-reference)

---

## 1. Get All Purchases

```
GET /api/v1/admin/purchases
```

Retrieve all purchases with optional filters across all module types.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | Long | null | Filter by user ID |
| status | Status | null | Filter by status |
| startDate | LocalDate | null | Start date (YYYY-MM-DD) |
| endDate | LocalDate | null | End date (YYYY-MM-DD) |
| page | int | 0 | Page number |
| size | int | 10 | Page size |
| sortBy | String | purchaseDate | Sort field |
| sortDir | String | desc | Sort direction (asc/desc) |

**Example Requests:**
```
GET /api/v1/admin/purchases
GET /api/v1/admin/purchases?status=PAID&page=0&size=20
GET /api/v1/admin/purchases?userId=123&startDate=2026-05-01&endDate=2026-05-31
GET /api/v1/admin/purchases?sortBy=amount&sortDir=asc
```

**Response:**
```json
{
  "message": "All purchases retrieved",
  "data": {
    "content": [
      {
        "purchaseId": 123,
        "transactionId": "550e8400-e29b-41d4-a716-446655440000",
        "amount": 500.00,
        "purchaseDate": "2026-05-15",
        "purchaseStatus": "PAID",
        "moduleType": "QUIZ",
        "setId": 456,
        "setName": "Physics Practice Set 1",
        "templateId": "550e8400-e29b-41d4-a716-446655440999",
        "templateName": "Physics Template",
        "trainingId": null,
        "trainingName": null,
        "subscriptionPlan": null,
        "entranceTypeSlug": null,
        "userId": 789,
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "paymentMethod": "ESEWA",
        "paymentProof": null,
        "paymentProofUrl": null
      }
    ],
    "totalElements": 150,
    "totalPages": 15,
    "pageNumber": 0,
    "pageSize": 10,
    "isLast": false
  }
}
```

---

## 2. Get Pending Approvals

```
GET /api/v1/admin/purchases/pending
```

Retrieve all purchases awaiting admin approval (manual payments).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| moduleType | String | null | Filter by QUIZ, TRAINING, SUBSCRIPTION |
| page | int | 0 | Page number |
| size | int | 10 | Page size |
| sortDir | String | desc | Sort direction |

**Example Requests:**
```
GET /api/v1/admin/purchases/pending
GET /api/v1/admin/purchases/pending?moduleType=QUIZ
GET /api/v1/admin/purchases/pending?moduleType=TRAINING&size=20
```

**Response:**
```json
{
  "message": "Pending purchases retrieved",
  "data": {
    "content": [
      {
        "purchaseId": 126,
        "transactionId": "550e8400-e29b-41d4-a716-446655440003",
        "amount": 250.00,
        "purchaseDate": "2026-05-18",
        "purchaseStatus": "PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING",
        "moduleType": "QUIZ",
        "setId": 457,
        "setName": "Chemistry Practice Set 1",
        "templateId": "uuid",
        "templateName": "Chemistry Template",
        "trainingId": null,
        "trainingName": null,
        "subscriptionPlan": null,
        "entranceTypeSlug": null,
        "userId": 792,
        "userName": "Alice Brown",
        "userEmail": "alice@example.com",
        "paymentMethod": "MANUAL",
        "paymentProof": "payment_proofs/receipt_126.jpg",
        "paymentProofUrl": "https://storage.url/payment_proofs/receipt_126.jpg"
      }
    ],
    "totalElements": 5,
    "totalPages": 1,
    "pageNumber": 0,
    "pageSize": 10,
    "isLast": true
  }
}
```

---

## 3. Get Purchases by Module Type

```
GET /api/v1/admin/purchases/type/{moduleType}
```

Retrieve purchases filtered by module type.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| moduleType | String | QUIZ, TRAINING, SUBSCRIPTION |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | Status | null | Filter by status |
| page | int | 0 | Page number |
| size | int | 10 | Page size |

**Example Requests:**
```
GET /api/v1/admin/purchases/type/QUIZ
GET /api/v1/admin/purchases/type/QUIZ?status=PENDING
GET /api/v1/admin/purchases/type/TRAINING
GET /api/v1/admin/purchases/type/SUBSCRIPTION
```

---

## 4. Get Training Purchases

```
GET /api/v1/admin/purchases/training
```

Retrieve all training course purchases.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | Status | null | Filter by status |
| trainingId | Long | null | Filter by training ID |
| page | int | 0 | Page number |
| size | int | 10 | Page size |

**Example Requests:**
```
GET /api/v1/admin/purchases/training
GET /api/v1/admin/purchases/training?status=PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING
GET /api/v1/admin/purchases/training?trainingId=101
```

**Response:**
```json
{
  "message": "Training purchases retrieved",
  "data": {
    "content": [
      {
        "purchaseId": 127,
        "transactionId": "550e8400-e29b-41d4-a716-446655440004",
        "amount": 299.00,
        "purchaseDate": "2026-05-19",
        "purchaseStatus": "PAID",
        "moduleType": "TRAINING",
        "setId": null,
        "setName": null,
        "templateId": null,
        "templateName": null,
        "trainingId": 101,
        "trainingName": "Advanced Physics Course",
        "subscriptionPlan": null,
        "entranceTypeSlug": null,
        "userId": 793,
        "userName": "Charlie Wilson",
        "userEmail": "charlie@example.com",
        "paymentMethod": "ESEWA",
        "paymentProof": null,
        "paymentProofUrl": null
      }
    ],
    "totalElements": 20,
    "totalPages": 2,
    "pageNumber": 0,
    "pageSize": 10,
    "isLast": false
  }
}
```

---

## 5. Get Subscription Purchases

```
GET /api/v1/admin/purchases/subscriptions
```

Retrieve all subscription purchases.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | Status | null | Filter by status |
| plan | String | null | Filter by plan (SILVER, GOLD, PREMIUM) |
| entranceTypeSlug | String | null | Filter by entrance type |
| page | int | 0 | Page number |
| size | int | 10 | Page size |

**Example Requests:**
```
GET /api/v1/admin/purchases/subscriptions
GET /api/v1/admin/purchases/subscriptions?plan=GOLD
GET /api/v1/admin/purchases/subscriptions?entranceTypeSlug=ioe
GET /api/v1/admin/purchases/subscriptions?plan=PREMIUM&entranceTypeSlug=cee
```

**Response:**
```json
{
  "message": "Subscription purchases retrieved",
  "data": {
    "content": [
      {
        "purchaseId": 128,
        "transactionId": "550e8400-e29b-41d4-a716-446655440005",
        "amount": 599.00,
        "purchaseDate": "2026-05-20",
        "purchaseStatus": "PAID",
        "moduleType": "SUBSCRIPTION",
        "setId": null,
        "setName": null,
        "templateId": null,
        "templateName": null,
        "trainingId": null,
        "trainingName": null,
        "subscriptionPlan": "GOLD",
        "entranceTypeSlug": "ioe",
        "userId": 794,
        "userName": "David Lee",
        "userEmail": "david@example.com",
        "paymentMethod": "KHALTI",
        "paymentProof": null,
        "paymentProofUrl": null
      }
    ],
    "totalElements": 45,
    "totalPages": 5,
    "pageNumber": 0,
    "pageSize": 10,
    "isLast": false
  }
}
```

---

## 6. Get Quiz Purchases

```
GET /api/v1/admin/purchases/quizzes
```

Retrieve all quiz purchases (question sets and quiz templates).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | Status | null | Filter by status |
| quizId | Long | null | Filter by question set ID |
| page | int | 0 | Page number |
| size | int | 10 | Page size |

**Example Requests:**
```
GET /api/v1/admin/purchases/quizzes
GET /api/v1/admin/purchases/quizzes?status=PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING
GET /api/v1/admin/purchases/quizzes?quizId=456
```

**Response:**
```json
{
  "message": "Quiz purchases retrieved",
  "data": {
    "content": [
      {
        "purchaseId": 129,
        "transactionId": "550e8400-e29b-41d4-a716-446655440006",
        "amount": 250.00,
        "purchaseDate": "2026-05-21",
        "purchaseStatus": "PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING",
        "moduleType": "QUIZ",
        "setId": 458,
        "setName": "Mathematics Practice Set 2",
        "templateId": "550e8400-e29b-41d4-a716-446655440888",
        "templateName": "Math Template",
        "trainingId": null,
        "trainingName": null,
        "subscriptionPlan": null,
        "entranceTypeSlug": null,
        "userId": 795,
        "userName": "Eve Davis",
        "userEmail": "eve@example.com",
        "paymentMethod": "MANUAL",
        "paymentProof": "payment_proofs/receipt_129.jpg",
        "paymentProofUrl": "https://storage.url/payment_proofs/receipt_129.jpg"
      }
    ],
    "totalElements": 80,
    "totalPages": 8,
    "pageNumber": 0,
    "pageSize": 10,
    "isLast": false
  }
}
```

---

## 7. Get Purchase Statistics

```
GET /api/v1/admin/purchases/statistics
```

Get summary statistics of all purchases.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startDate | LocalDate | null | Start date filter |
| endDate | LocalDate | null | End date filter |

**Example Requests:**
```
GET /api/v1/admin/purchases/statistics
GET /api/v1/admin/purchases/statistics?startDate=2026-05-01&endDate=2026-05-31
```

**Response:**
```json
{
  "message": "Purchase statistics retrieved",
  "data": {
    "totalPurchases": 500,
    "totalRevenue": 75000.00,
    "byStatus": {
      "PAID": 400,
      "PENDING": 30,
      "PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING": 15,
      "FAILED": 40,
      "REJECTED_BY_ADMIN": 15
    },
    "byModuleType": {
      "QUIZ": 300,
      "TRAINING": 100,
      "SUBSCRIPTION": 100
    },
    "byPaymentMethod": {
      "ESEWA": 250,
      "KHALTI": 150,
      "MANUAL": 100
    },
    "pendingApprovals": 15,
    "recentPurchases": 50
  }
}
```

---

## 8. Approve Purchase

```
POST /api/v1/admin/purchases/{purchaseId}/approve
```

Approve a pending purchase. Unlocks access to the purchased content.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| purchaseId | Long | Purchase ID to approve |

**Example Request:**
```
POST /api/v1/admin/purchases/126/approve
```

**Response:**
```json
{
  "message": "Purchase approved successfully",
  "data": {
    "purchaseId": 126,
    "transactionId": "550e8400-e29b-41d4-a716-446655440003",
    "amount": 250.00,
    "purchaseDate": "2026-05-18",
    "purchaseStatus": "PAID",
    "moduleType": "QUIZ",
    "setId": 457,
    "setName": "Chemistry Practice Set 1",
    "templateId": "uuid",
    "templateName": "Chemistry Template",
    "trainingId": null,
    "trainingName": null,
    "subscriptionPlan": null,
    "entranceTypeSlug": null,
    "userId": 792,
    "userName": "Alice Brown",
    "userEmail": "alice@example.com",
    "paymentMethod": "MANUAL",
    "paymentProof": "payment_proofs/receipt_126.jpg",
    "paymentProofUrl": "https://storage.url/payment_proofs/receipt_126.jpg"
  }
}
```

**Action:** Status changes to `PAID`

---

## 9. Reject Purchase

```
POST /api/v1/admin/purchases/{purchaseId}/reject
```

Reject a purchase. User can re-submit payment.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| purchaseId | Long | Purchase ID to reject |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reason | String | No | Rejection reason |

**Example Request:**
```
POST /api/v1/admin/purchases/126/reject?reason=Payment proof is invalid
```

**Response:**
```json
{
  "message": "Purchase rejected successfully",
  "data": {
    "purchaseId": 126,
    "transactionId": "550e8400-e29b-41d4-a716-446655440003",
    "amount": 250.00,
    "purchaseDate": "2026-05-18",
    "purchaseStatus": "REJECTED_BY_ADMIN",
    "moduleType": "QUIZ",
    "setId": 457,
    "setName": "Chemistry Practice Set 1",
    "templateId": "uuid",
    "templateName": "Chemistry Template",
    "trainingId": null,
    "trainingName": null,
    "subscriptionPlan": null,
    "entranceTypeSlug": null,
    "userId": 792,
    "userName": "Alice Brown",
    "userEmail": "alice@example.com",
    "paymentMethod": "MANUAL",
    "paymentProof": "payment_proofs/receipt_126.jpg",
    "paymentProofUrl": "https://storage.url/payment_proofs/receipt_126.jpg"
  }
}
```

**Action:** Status changes to `REJECTED_BY_ADMIN`

---

## 10. Admin Payment Processing

```
POST /api/v1/payments/admin/pay/{id}/{type}
Authorization: Bearer {token}
Access: ADMIN, SUPER_ADMIN
Content-Type: application/json
```

Admin records payment on behalf of a user.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | String | Module ID (can be user email for subscriptions) |
| type | String | Module type |

**Request Body:**
```json
{
  "amount": 500.00,
  "paymentMethod": "ESEWA",
  "userEmail": "user@example.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | BigDecimal | Yes | Payment amount |
| paymentMethod | String | Yes | ESEWA, KHALTI, MANUAL |
| userEmail | String | No | Target user email (for admin payment) |

**Response:**
```json
{
  "purchaseId": 123,
  "status": "PENDING",
  "paymentType": "ESEWA",
  "paymentDate": "2026-05-18T10:30:00",
  "amount": 500.00,
  "paymentMethod": "ESEWA",
  "transactionReference": "uuid-string"
}
```

---

## 11. Request/Response Schemas

### AdminPurchaseResponse
```json
{
  "purchaseId": 123,
  "transactionId": "uuid",
  "amount": 500.00,
  "purchaseDate": "2026-05-15",
  "purchaseStatus": "PAID",
  "moduleType": "QUIZ",
  "setId": 456,
  "setName": "Physics Practice Set 1",
  "templateId": "uuid",
  "templateName": "Physics Template",
  "trainingId": null,
  "trainingName": null,
  "subscriptionPlan": null,
  "entranceTypeSlug": null,
  "userId": 789,
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "paymentMethod": "ESEWA",
  "paymentProof": "file.jpg",
  "paymentProofUrl": "https://storage.url/file.jpg"
}
```

### PageResponse
```json
{
  "content": [...],
  "totalElements": 100,
  "totalPages": 10,
  "pageNumber": 0,
  "pageSize": 10,
  "isLast": false
}
```

### PurchaseStatisticsResponse
```json
{
  "totalPurchases": 500,
  "totalRevenue": 75000.00,
  "byStatus": { "PAID": 400, "PENDING": 30, ... },
  "byModuleType": { "QUIZ": 300, "TRAINING": 100, "SUBSCRIPTION": 100 },
  "byPaymentMethod": { "ESEWA": 250, "KHALTI": 150, "MANUAL": 100 },
  "pendingApprovals": 15,
  "recentPurchases": 50
}
```

### PaymentRequest (Admin)
```json
{
  "amount": 500.00,
  "paymentMethod": "ESEWA",
  "userEmail": "user@example.com"
}
```

### PaymentResponse
```json
{
  "purchaseId": 123,
  "status": "PENDING",
  "paymentType": "ESEWA",
  "paymentDate": "2026-05-18T10:30:00",
  "amount": 500.00,
  "paymentMethod": "ESEWA",
  "transactionReference": "uuid"
}
```

---

## 12. Enums Reference

### Status
| Value | Description |
|-------|-------------|
| PAID | Payment completed, content unlocked |
| PENDING | Awaiting gateway confirmation |
| PAYMENT_RECEIVED_ADMIN_APPROVAL_PENDING | Manual payment, awaiting approval |
| FAILED | Payment failed/cancelled |
| REJECTED_BY_ADMIN | Rejected by admin |
| CANCELLED_BY_ADMIN | Cancelled by admin |

### ModuleType
| Value | Description |
|-------|-------------|
| QUIZ | Question set or quiz template |
| TRAINING | Training course |
| SUBSCRIPTION | Subscription plan |

### PaymentMethod
| Value | Description |
|-------|-------------|
| ESEWA | eSewa digital wallet |
| KHALTI | Khalti digital wallet |
| MANUAL | Bank transfer (requires approval) |

### SubscriptionPlan
| Value | Description |
|-------|-------------|
| SILVER | Entry-level subscription |
| GOLD | Standard subscription |
| PREMIUM | Premium subscription |

---

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer {accessToken} |
| Content-Type | Yes | application/json |

---

## Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/purchases` | Get all purchases (unified with filters) |
| GET | `/admin/purchases/pending` | Get pending approvals |
| GET | `/admin/purchases/type/{moduleType}` | Get by module type |
| GET | `/admin/purchases/training` | Get training purchases |
| GET | `/admin/purchases/subscriptions` | Get subscription purchases |
| GET | `/admin/purchases/quizzes` | Get quiz purchases |
| GET | `/admin/purchases/statistics` | Get statistics |
| POST | `/admin/purchases/{purchaseId}/approve` | Approve purchase |
| POST | `/admin/purchases/{purchaseId}/reject` | Reject purchase |
| POST | `/payments/admin/pay/{id}/{type}` | Admin process payment for user |