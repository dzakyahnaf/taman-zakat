# Task Manager Web Application

Aplikasi web Task Manager sederhana yang dibangun dengan Next.js, Prisma, PostgreSQL, dan Tailwind CSS. Aplikasi ini mendukung autentikasi pengguna, CRUD operations untuk task, dan activity logging.

## 📋 Fitur

- 🔐 **Autentikasi User**: Register dan login dengan JWT-based authentication
- ✅ **CRUD Task**: Membuat, membaca, mengubah, dan menghapus task
- 📊 **Status Management**: Task dengan status (todo, in-progress, done)
- 📅 **Due Date**: Set tanggal jatuh tempo untuk setiap task
- 🔍 **Filter**: Filter task berdasarkan status
- 📝 **Activity Logging**: Log otomatis untuk setiap aktivitas user
- 🎨 **Responsive Design**: UI modern dan responsif dengan Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers (API Routes)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **Styling**: Tailwind CSS

## 📦 Instalasi

### Prerequisites

- Node.js 18+ 
- PostgreSQL database terinstall dan running
- npm atau yarn

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd tamanzakat-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Copy `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` dan sesuaikan dengan konfigurasi database Anda:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
   JWT_SECRET="your-secret-key-here"
   NEXT_PUBLIC_API_URL="http://localhost:3000"
   ```

4. **Setup database**
   
   Jalankan Prisma migration untuk membuat tabel database:
   ```bash
   npx prisma migrate dev --name init
   ```
   
   Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Akses aplikasi**
   
   Buka browser dan akses `http://localhost:3000`

## 1️⃣ Desain Arsitektur Aplikasi

### Komponen Utama

```mermaid
graph TB
    Client[Client Browser] -->|HTTP/HTTPS| NextJS[Next.js App]
    
    subgraph "Next.js Application"
        NextJS --> Pages[Pages/Routes]
        NextJS --> APIRoutes[API Route Handlers]
        NextJS --> Components[React Components]
        
        Pages --> AuthContext[Auth Context]
        Components --> AuthContext
        
        APIRoutes --> AuthLib[Auth Library]
        APIRoutes --> ActivityLogger[Activity Logger]
        APIRoutes --> PrismaClient[Prisma Client]
    end
    
    PrismaClient -->|SQL Queries| PostgreSQL[(PostgreSQL Database)]
    
    subgraph "Database Schema"
        PostgreSQL --> Users[Users Table]
        PostgreSQL --> Tasks[Tasks Table]
        PostgreSQL --> ActivityLogs[Activity Logs Table]
    end
```

### Komunikasi Antar Komponen

1. **Client Layer**: Browser mengakses aplikasi Next.js melalui HTTP/HTTPS
2. **UI Layer**: React components merender UI dan mengirim request ke API
3. **Context Layer**: AuthContext mengelola state autentikasi di client-side
4. **API Layer**: Next.js Route Handlers menerima request dan memproses business logic
5. **Service Layer**: Utility functions (auth, activity logger) menyediakan reusable logic
6. **Data Layer**: Prisma ORM berkomunikasi dengan PostgreSQL untuk CRUD operations
7. **Database Layer**: PostgreSQL menyimpan data users, tasks, dan activity logs

### Flow Autentikasi
1. User mengirim credentials → API `/auth/login`
2. API memverifikasi password dengan bcrypt
3. Generate JWT token dan kirim ke client
4. Client menyimpan token di localStorage
5. Request selanjutnya menyertakan token di header `Authorization: Bearer <token>`
6. API memverifikasi token sebelum memproses request

## 2️⃣ Desain Model Data / Schema Tabel

### User Table
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Hashed with bcrypt
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tasks         Task[]
  activityLogs  ActivityLog[]
  
  @@index([email])
}
```

**Penjelasan:**
- `id`: Primary key (UUID)
- `email`: Unique identifier untuk login
- `password`: Hash password menggunakan bcrypt (12 salt rounds)
- Relations: One-to-many dengan Task dan ActivityLog

### Task Table
```prisma
model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  userId      String
  
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityLogs  ActivityLog[]
  
  @@index([userId])
  @@index([status])
  @@index([dueDate])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

**Penjelasan:**
- `id`: Primary key (UUID)
- `status`: Enum dengan 3 nilai (TODO, IN_PROGRESS, DONE)
- `dueDate`: Optional, untuk deadline task
- `userId`: Foreign key ke User table
- Cascade delete: jika user dihapus, semua tasknya ikut terhapus
- Indexes untuk optimasi query berdasarkan userId, status, dan dueDate

### ActivityLog Table
```prisma
model ActivityLog {
  id        String   @id @default(uuid())
  action    String   // CREATE, UPDATE, DELETE, LOGIN, REGISTER
  entity    String   // Task, User
  entityId  String?
  details   String?  // JSON string
  userId    String
  taskId    String?
  createdAt DateTime @default(now())
  
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  task Task? @relation(fields: [taskId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

**Penjelasan:**
- Menyimpan semua aktivitas user (login, create task, update task, delete task)
- `details`: JSON string untuk informasi tambahan
- Relations ke User dan Task (optional untuk task)
- Indexes untuk query berdasarkan userId, action, dan waktu

## 3️⃣ Desain Endpoint REST API

### Authentication Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/auth/register` | Register user baru | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |

**POST `/api/auth/register`**
- Request Body: `{ email, password, name }`
- Response: `{ success, data: { user, token } }`
- Validasi: email unique, password min 6 karakter
- Action: Hash password, create user, generate JWT, log activity

**POST `/api/auth/login`**
- Request Body: `{ email, password }`
- Response: `{ success, data: { user, token } }`
- Validasi: verify password dengan bcrypt
- Action: Generate JWT token, log login activity

### Task Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/tasks` | Get semua task user | ✅ |
| POST | `/api/tasks` | Create task baru | ✅ |
| GET | `/api/tasks/[id]` | Get task by ID | ✅ |
| PATCH | `/api/tasks/[id]` | Update task | ✅ |
| DELETE | `/api/tasks/[id]` | Delete task | ✅ |

**GET `/api/tasks`**
- Query Params: `?status=TODO|IN_PROGRESS|DONE` (optional)
- Response: `{ success, data: [tasks] }`
- Filter: hanya task milik user yang login
- Sort: by dueDate ASC, createdAt DESC

**POST `/api/tasks`**
- Request Body: `{ title, description?, status?, dueDate? }`
- Response: `{ success, data: task }`
- Validasi: title required
- Action: Create task, log CREATE activity

**GET `/api/tasks/[id]`**
- Response: `{ success, data: task }`
- Validasi: task harus milik user yang login

**PATCH `/api/tasks/[id]`**
- Request Body: `{ title?, description?, status?, dueDate? }`
- Response: `{ success, data: task }`
- Validasi: task harus milik user yang login
- Action: Update task, log UPDATE activity

**DELETE `/api/tasks/[id]`**
- Response: `{ success, data: { message } }`
- Validasi: task harus milik user yang login
- Action: Delete task, log DELETE activity

### Activity Log Endpoint

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/activity` | Get activity logs | ✅ |

**GET `/api/activity`**
- Query Params: `?limit=50` (default 50)
- Response: `{ success, data: [logs] }`
- Filter: hanya log milik user yang login
- Sort: by createdAt DESC
- Include: related task title

### Authentication Flow

Semua protected endpoints menggunakan JWT Bearer token:
```
Authorization: Bearer <token>
```

Middleware di `/lib/api-utils.ts` function `getUserFromRequest()` akan:
1. Extract token dari header
2. Verify token dengan JWT_SECRET
3. Return user payload atau null
4. Endpoint return 401 Unauthorized jika token invalid

## 4️⃣ Node.js vs Go: Pilihan dan Alasan

### Bagian yang Cocok untuk Node.js ✅

**1. API Layer & Business Logic**
- ✅ **Dipilih**: Next.js Route Handlers (Node.js)
- **Alasan**:
  - Full-stack framework dalam satu codebase
  - TypeScript support untuk type safety
  - Mudah integrate dengan React frontend
  - Rich ecosystem (Prisma, JWT libraries)
  - Hot reload dan DX (Developer Experience) sangat baik
  - Cocok untuk aplikasi skala kecil-menengah

**2. ORM & Database Layer**
- ✅ **Dipilih**: Prisma (Node.js/TypeScript)
- **Alasan**:
  - Type-safe database client
  - Migrasi database yang mudah
  - Auto-completion dan IntelliSense
  - Query builder yang ekspresif
  - Support PostgreSQL dengan baik

**3. Frontend**
- ✅ **Dipilih**: Next.js + React (Node.js)
- **Alasan**:
  - React ecosystem adalah yang terbesar untuk UI
  - Server-side rendering untuk SEO
  - App Router untuk routing modern
  - Tailwind CSS integration sempurna

### Bagian yang Lebih Cocok untuk Go 🔄

**1. High-Performance API Gateway**
- **Skenario**: Jika aplikasi di-scale ke microservices
- **Alasan Go Lebih Baik**:
  - Goroutines untuk concurrent request handling
  - Lower latency dan memory footprint
  - Native HTTP performance lebih cepat
  - Cocok untuk API gateway yang handle jutaan request/detik

**2. Background Job Processor**
- **Skenario**: Task queue untuk email notifications, report generation
- **Alasan Go Lebih Baik**:
  - Goroutines untuk parallel processing
  - Built-in concurrency primitives (channels, select)
  - Lebih efisien untuk CPU-intensive tasks
  - Binary executable tanpa runtime overhead

**3. Real-time WebSocket Server**
- **Skenario**: Live task updates, collaborative editing
- **Alasan Go Lebih Baik**:
  - Goroutines bisa handle ribuan concurrent WebSocket connections
  - Lower memory per connection
  - Built-in concurrency untuk broadcasting messages

**4. Analytics & Reporting Service**
- **Skenario**: Complex data aggregation, batch processing
- **Alasan Go Lebih Baik**:
  - Faster execution untuk heavy computation
  - Better memory management untuk large datasets
  - Goroutines untuk parallel query execution

### Hybrid Architecture (Ideal untuk Scale)

```
┌─────────────────────────────────────────────┐
│         Next.js Frontend (Node.js)          │
│  - UI rendering, SSR, client-side logic     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      Next.js API Routes (Node.js)           │
│  - User-facing CRUD endpoints               │
│  - Authentication & session management      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Go Microservices (Optional)         │
│  - Background jobs (email, notifications)   │
│  - Analytics & reporting service            │
│  - WebSocket server for real-time updates   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           PostgreSQL Database               │
└─────────────────────────────────────────────┘
```

### Kesimpulan
Untuk aplikasi Task Manager sederhana ini, **Node.js dengan Next.js adalah pilihan terbaik** karena:
- Full-stack dalam satu bahasa (JavaScript/TypeScript)
- Faster development dengan ecosystem yang kaya
- Mudah di-maintain oleh satu tim
- Cukup performant untuk skala kecil-menengah

**Go lebih cocok ditambahkan** ketika:
- Aplikasi sudah scale dan butuh microservices
- Ada kebutuhan real-time (WebSocket) dengan ribuan koneksi
- Background jobs yang CPU-intensive
- Need untuk extreme performance optimization

## 5️⃣ Strategi Testing

### 1. API Endpoint Testing (Priority: HIGH)

**Tool**: Jest + Supertest atau Postman/Thunder Client

**Test Cases untuk `/api/tasks` (POST):**

```typescript
describe('POST /api/tasks', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Setup: Login dan dapatkan token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = loginRes.body.data.token;
  });
  
  test('should create task with valid data', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task',
        description: 'Test description',
        status: 'TODO',
        dueDate: '2026-12-31'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Task');
  });
  
  test('should fail without authentication', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Unauthorized Task' });
    
    expect(res.status).toBe(401);
  });
  
  test('should fail without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'No title' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });
  
  test('should log activity after creation', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Task with Log' });
    
    const logRes = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${authToken}`);
    
    const createLog = logRes.body.data.find(
      (log: any) => log.action === 'CREATE' && log.entityId === taskRes.body.data.id
    );
    
    expect(createLog).toBeDefined();
  });
});
```

### 2. Authentication Testing

**Test Cases:**
- ✅ Register dengan email valid
- ✅ Register dengan email duplicate (harus fail)
- ✅ Register dengan password < 6 karakter (harus fail)
- ✅ Login dengan credentials benar
- ✅ Login dengan password salah (harus fail)
- ✅ Access protected endpoint tanpa token (harus 401)
- ✅ Access protected endpoint dengan token invalid (harus 401)

### 3. Database Integration Testing

**Setup**: Test database terpisah

```typescript
beforeAll(async () => {
  // Setup test database
  await prisma.$executeRaw`CREATE DATABASE taskmanager_test`;
  await prisma.$migrate();
});

afterAll(async () => {
  // Cleanup
  await prisma.$executeRaw`DROP DATABASE taskmanager_test`;
  await prisma.$disconnect();
});

test('should cascade delete tasks when user is deleted', async () => {
  const user = await prisma.user.create({
    data: { email: 'test@example.com', password: 'hashed', name: 'Test' }
  });
  
  await prisma.task.create({
    data: { title: 'Task 1', userId: user.id }
  });
  
  await prisma.user.delete({ where: { id: user.id } });
  
  const tasks = await prisma.task.findMany({ where: { userId: user.id } });
  expect(tasks).toHaveLength(0);
});
```

### 4. Frontend Component Testing

**Tool**: React Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import TaskModal from '@/app/dashboard/page';

test('should submit task form with valid data', async () => {
  render(<TaskModal task={null} token="test-token" />);
  
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'New Task' }
  });
  
  fireEvent.click(screen.getByText('Create'));
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks', expect.any(Object));
  });
});
```

### 5. Manual Testing Checklist

**Authentication Flow:**
- [ ] Register user baru
- [ ] Login dengan user yang baru dibuat
- [ ] Logout dan verify token dihapus
- [ ] Try access dashboard tanpa login (harus redirect ke /login)

**Task CRUD:**
- [ ] Create task dengan semua field
- [ ] Create task hanya dengan title (minimal)
- [ ] Update task title, description, status, dueDate
- [ ] Delete task dan confirm deletion
- [ ] Filter tasks by status (TODO, IN_PROGRESS, DONE)
- [ ] Verify task sorting (by due date)

**Activity Logging:**
- [ ] Check activity logs after login
- [ ] Check activity logs after create task
- [ ] Check activity logs after update task
- [ ] Check activity logs after delete task

### 6. Performance Testing (Optional)

**Tool**: Artillery atau k6

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: 'Get Tasks'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
          capture:
            - json: '$.data.token'
              as: 'token'
      - get:
          url: '/api/tasks'
          headers:
            Authorization: 'Bearer {{ token }}'
```

### Test Coverage Target

- **API Endpoints**: 80%+ coverage
- **Authentication Logic**: 100% coverage
- **Critical Paths** (create, update, delete task): 100% coverage
- **UI Components**: 60%+ coverage

## 📚 Struktur Project

```
tamanzakat-test/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── tasks/
│   │   │   ├── [id]/route.ts
│   │   │   └── route.ts
│   │   └── activity/route.ts
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── context/
│   └── AuthContext.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── api-utils.ts
│   └── activity-logger.ts
├── prisma/
│   └── schema.prisma
├── .env
├── .env.example
├── package.json
└── README.md
```

## 🔐 Security Features

- ✅ Password hashing with bcrypt (12 salt rounds)
- ✅ JWT-based authentication with 7-day expiry
- ✅ Protected API routes dengan Bearer token verification
- ✅ User-specific data isolation (users can only access their own tasks)
- ✅ SQL injection protection via Prisma ORM
- ✅ Environment variables untuk sensitive data
