# Architecture Overview: Dental Clinic Management System (DCMS)

## 1. Project Overview
The Dental Clinic Management System (DCMS) is a modern, high-performance web application designed to manage clinic operations efficiently. It streamlines appointment scheduling, medical records management, invoicing, and patient communication.

## 2. Technology Stack
- **React**: Frontend UI library for building dynamic, interactive user interfaces.
- **TypeScript**: Adds static typing to JavaScript, improving DX (Developer Experience) and reducing runtime errors.
- **Vite**: Next-generation frontend tooling that provides an extremely fast development server and optimized production builds.
- **Supabase**: Open-source app platform providing a Postgres database, Authentication, real-time subscriptions, and instant APIs.

## 3. Folder Structure
The codebase follows a modular React architecture within the `src/` directory:
- **`components/`**: Reusable, presentation-focused UI components (e.g., Modals, Buttons, Layouts, Forms, Charts).
- **`constants/`**: Configuration files and static constants (e.g., query keys, default settings).
- **`hooks/`**: Custom React hooks handling business logic and side-effects (e.g., `useAppointments`, `usePatients`).
- **`pages/`**: Route-level components representing distinct application views (e.g., AdminDashboard, Booking, MedicalRecords).
- **`services/`**: Modules for external interactions. Primarily encapsulates Supabase queries, Cloudinary uploads, and generic data fetching/RPC calls.
- **`types/`**: TypeScript interface and type definitions shared across the project.
- **`utils/`**: Helper utilities and functions (e.g., custom logger, date formatters, financial calculations).

## 4. Role-Based Access Control
The system enforces strict data access using Supabase RLS (Row Level Security) policies and application-level routing based on user roles:
- **`super_admin`**: Full system access. Can modify core settings, manage system configurations, and execute critical actions like factory database resets.
- **`admin`**: Full operational access. Can read/write patients, appointments, medical records, and invoices. Cannot modify critical system configurations or perform factory resets.
- **`receptionist`**: Staff-level access tailored for front-desk tasks such as booking walk-ins, viewing the daily schedule, and managing the appointment queue (functionally governed by admin-level RLS with restricted UI paths).

## 5. Supabase RPC Functions
The database relies on Custom Postgres Functions (`RPC`) to guarantee data integrity, perform atomic operations, and prevent race conditions:
- **`book_appointment`**: Issues row-level locks, prevents double-booking, and handles normalized appointment inserts atomically.
- **`check_booking_rate_limit`**: Mitigates spam by enforcing a maximum of 3 pending/confirmed appointments per phone number per hour.
- **`get_financial_summary`**: Aggregates total outstanding balances, monthly/yearly revenues, and pending invoices efficiently.
- **`get_patient_financial_summary`**: Computes consolidated billing statistics specific to an individual patient.
- **`get_next_invoice_number`**: Returns an auto-incremented, formatted, and sequential invoice identifier.
- **`factory_reset_data`**: A secure, `super_admin`-only function that clears all transactional data (patients, appointments, records, invoices) while retaining configuration settings.
- **`find_or_create_patient`**: Securely looks up a patient by phone or creates a new one, hiding the `patients` table from public read/write.
- **`release_slot_lock`**: Safely releases a pending booking lock tied to an anonymous user's session identifier.
- **`get_my_role`**: Securely fetches the authenticated user's role from the private `admin_users` table for internal RLS checks.

## 6. Developer Setup Instructions
Follow these steps to set up the development environment locally:

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd path/to/project
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Environment Setup**
   Duplicate `.env.example` as `.env` and fill in your Supabase URL, Anon Key, and any necessary API keys (e.g., Cloudinary credentials).
4. **Database Migration**
   Open your Supabase project's SQL Editor and run the contents of `migrations.sql` to initialize all tables, policies, constraints, views, and RPCs.
5. **Run the Dev Server**
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*
6. **(Optional) Run Tests**
   ```bash
   npx vitest run
   ```
   *Executes unit and integration tests to verify business logic.*
