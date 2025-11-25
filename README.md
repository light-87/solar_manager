# Solar Sales Management System

A modern, professional web application for managing solar sales customers with finance and cash workflows. Built with Next.js, TypeScript, Tailwind CSS, Supabase, and Vercel Blob.

![Solar Sales Manager](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## Features

### 🔐 Authentication & Access Control
- **PIN-based login system** (5-digit PINs)
- **Two user roles:**
  - **Admin**: Full access to Finance, Cash tabs, and Settings
  - **Employee**: Access to Finance tab only
- Role-based navigation and route protection
- Secure PIN management in Settings

### 📊 Dashboard Overview
- Real-time statistics cards (Active, Completed, Archived customers)
- Separate dashboards for Finance and Cash workflows
- Advanced filtering:
  - Search by customer name
  - Filter by status (Active/Completed/Archived)
  - Filter by current step (1-15)
- Responsive customer table with sortable columns

### 💼 Customer Management
- **15-step workflow tracking** for both Finance and Cash customers
- Visual progress stepper showing current step
- Customer detail view with:
  - Complete customer information
  - Step-by-step progress tracking
  - Notes section for additional information
- Different workflows for Finance vs Cash customers:
  - Finance: Full 15-step workflow with bank processes
  - Cash: Modified workflow (Steps 3 & 14 skipped)

### 🎨 Design
- Modern, clean design inspired by Claude.ai/Anthropic
- Professional amber/stone color scheme
- Fully responsive layout
- Custom scrollbars
- Smooth transitions and animations

### 🛠️ Technology Stack
- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS 4 with custom theme
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Vercel Blob (ready for implementation)
- **Authentication**: Custom PIN-based system with bcrypt

## Project Structure

```
solar_manager/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── init/route.ts          # Initialize default users
│   │   │   ├── login/route.ts         # PIN login
│   │   │   └── change-pin/route.ts    # Change PIN
│   │   ├── customers/
│   │   │   ├── route.ts               # Get/Create customers
│   │   │   └── [id]/
│   │   │       ├── route.ts           # Get/Update/Delete customer
│   │   │       └── steps/route.ts     # Get/Update step data
│   │   └── stats/route.ts             # Dashboard statistics
│   ├── dashboard/
│   │   ├── page.tsx                   # Finance dashboard
│   │   ├── cash/page.tsx              # Cash dashboard (Admin only)
│   │   ├── customer/[id]/page.tsx     # Customer detail view
│   │   └── settings/page.tsx          # Admin settings
│   ├── login/page.tsx                 # Login page
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Home (redirects)
│   └── globals.css                    # Global styles
├── components/
│   ├── DashboardLayout.tsx            # Main layout with navigation
│   └── ProtectedRoute.tsx             # Auth protection wrapper
├── lib/
│   ├── supabase.ts                    # Supabase client
│   ├── auth-context.tsx               # Auth context provider
│   └── utils.ts                       # Utility functions
├── types/
│   └── index.ts                       # TypeScript definitions
├── DATABASE_SCHEMA.md                 # Database setup guide
└── README.md                          # This file
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment and Blob storage)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd solar_manager
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API and copy your:
   - Project URL
   - Anon/Public Key
3. Open the SQL Editor in Supabase
4. Run all SQL commands from `DATABASE_SCHEMA.md` in order

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Vercel Blob Storage (optional for now)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 4. Initialize Default Users

Run the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:3000`

Initialize the database with default users:

```bash
curl -X POST http://localhost:3000/api/auth/init
```

This creates two users:
- **Admin PIN**: 12345
- **Employee PIN**: 54321

**⚠️ IMPORTANT**: Change these PINs immediately after first login via Settings!

### 5. Login

Visit `http://localhost:3000/login` and login with:
- Select role (Admin or Employee)
- Enter the default PIN
- You'll be redirected to the dashboard

## Usage Guide

### For Employees

1. **Login** with Employee role
2. Access **Finance Tab** to:
   - View finance customers
   - Search and filter customers
   - Add new finance customers
   - View customer details and progress

### For Admins

1. **Login** with Admin role
2. Access **Finance Tab** for finance customers
3. Access **Cash Tab** for cash customers
4. Access **Settings** to:
   - Change Admin PIN
   - Change Employee PIN
   - View security best practices

### Managing Customers

#### Creating a New Customer
1. Click "New Customer" button
2. Fill in:
   - Customer Name (required)
   - Email (optional)
   - Phone Number (required)
   - Address (optional)
3. Customer is created with Step 1 initialized

#### Viewing Customer Details
1. Click on any customer row in the table
2. View:
   - Customer information
   - Progress through 15 steps
   - Visual stepper showing completed/current/pending steps
   - Notes section

#### 15-Step Workflow

**Finance Customers:**
1. Details & Documents
2. Online Application
3. Submit to Bank
4. Bank Call Verification
5. 1st Disbursement
6. Material Supplier
7. Installation
8. File Completion
9. Print & Submit Online
10. MSEB Inspection
11. MSEB Meter Release
12. Meter Installation
13. Mail Bank
14. Bank Inspection
15. Final Disbursement

**Cash Customers:**
- Same 15 steps but Steps 3 and 14 are automatically skipped
- Step 5 has different fields (Payment Type: Advance/Full)
- Step 15 auto-completes if full payment was made in Step 5

## Development

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `BLOB_READ_WRITE_TOKEN`
4. Deploy!

After deployment:
1. Run the init endpoint: `https://your-app.vercel.app/api/auth/init`
2. Login and change default PINs immediately

## Extending the Application

### Adding Step Forms

The customer detail page (`/dashboard/customer/[id]/page.tsx`) currently has placeholder step forms. To implement:

1. Create step form components in `components/steps/`
2. Reference the types in `types/index.ts` for each step's data structure
3. Use the API endpoint `/api/customers/[id]/steps` to save step data
4. Update customer's `current_step` when a step is completed

Example for Step 1:

```typescript
// components/steps/Step1Form.tsx
import { Step1Data } from '@/types';

export function Step1Form({ customerId, data, onSave }) {
  const handleSubmit = async (formData: Step1Data) => {
    await fetch(`/api/customers/${customerId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_number: 1,
        data: formData,
      }),
    });
    onSave();
  };
  // ... form implementation
}
```

### Adding File Upload

1. Set up Vercel Blob in your Vercel dashboard
2. Create API route for file upload:

```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file') as File;
  const blob = await put(file.name, file, { access: 'public' });
  return Response.json({ url: blob.url });
}
```

3. Use in step forms for document uploads

### Adding PDF Generation

Install jspdf (already included):

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateCustomerReport(customer, steps) {
  const doc = new jsPDF();
  doc.text(`Customer Report: ${customer.name}`, 10, 10);
  // Add customer details, step progress, etc.
  doc.save(`${customer.name}_report.pdf`);
}
```

### Adding Archive Functionality

1. Download customer data as PDF
2. Delete files from Vercel Blob
3. Update customer status to 'archived':

```typescript
await fetch(`/api/customers/${customerId}`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'archived' }),
});
```

## Security Considerations

- PINs are hashed using bcrypt before storage
- Role-based access control on frontend and API routes
- Protected routes redirect unauthorized users
- Environment variables keep sensitive data secure
- HTTPS enforced in production (Vercel default)

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and key in `.env.local`
- Check Supabase project is active
- Review Row Level Security policies

### Authentication Not Working
- Run `/api/auth/init` to create default users
- Check browser console for errors
- Verify PIN is exactly 5 digits
- Clear localStorage and try again

### Customers Not Loading
- Check API routes are working: `/api/customers`
- Verify database tables exist in Supabase
- Check browser network tab for errors

## Future Enhancements

- [ ] Implement all 15 step forms with validation
- [ ] Add file upload with Vercel Blob integration
- [ ] PDF generation for customer reports
- [ ] Archive functionality with file cleanup
- [ ] Email notifications for step completions
- [ ] Dashboard analytics and charts
- [ ] Export data to Excel
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Mobile app version

## License

MIT License - feel free to use this project for your business needs.

## Support

For issues or questions:
1. Check this README
2. Review `DATABASE_SCHEMA.md`
3. Check the code comments
4. Open an issue on GitHub

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
