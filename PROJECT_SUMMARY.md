# District 79 Directory - Project Summary

## Overview
A comprehensive Next.js 15 application for managing and searching District 79 Adult Education and Youth Program sites with MongoDB backend and advanced PDF export functionality.

## Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **PDF Generation**: jsPDF + jspdf-autotable
- **CSV Processing**: csv-parse

## Key Features

### 1. Public Search Interface (`/`)
- **Search**: Real-time search across site names, addresses, and programs
- **Smart Filters**: 
  - Borough filter
  - Program type filter
  - Category filter (Adult Ed / Youth)
- **Sorting**: By name, borough, or program
- **Display**: Clean cards showing site details, hours, and contact information

### 2. Admin Panel (`/admin`)
- **CSV Import**: Easy upload of new data from CSV files
  - Supports both Adult Education and Youth Program formats
  - Automatic data parsing and categorization
- **Site Management**: 
  - View all sites in a table
  - Edit sites inline
  - Delete sites
  - Filter by category
- **PDF Export**: 
  - Groups sites by program
  - Shows program header with principal info
  - Alphabetically sorted programs
  - Handles multiple assistant principals (separated by `/`)
  - Includes email addresses
  - Filters out invalid hour data

### 3. API Routes
- `GET /api/sites` - Fetch all sites
- `POST /api/sites` - Create a site
- `PUT /api/sites/[id]` - Update a site
- `DELETE /api/sites/[id]` - Delete a site
- `POST /api/upload` - Upload and import CSV

## File Structure
```
district79-directory/
├── app/
│   ├── admin/              # Admin panel
│   │   └── page.tsx        # Admin interface with PDF export
│   ├── api/                # API routes
│   │   ├── sites/          # Site CRUD operations
│   │   └── upload/         # CSV upload handler
│   ├── page.tsx            # Public search interface
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── lib/
│   └── mongodb.ts          # MongoDB connection
├── public/                 # Static assets
│   └── images/             # Logos and images
└── District 79 Site List - 25-26 SY(*).csv  # Source data files
```

## Environment Setup

### Required Files
1. `.env.local` with MongoDB connection:
```
MONGODB_URI=your_mongodb_connection_string
```

### Installation
```bash
npm install
npm run dev
```

## Usage

### Initial Setup
1. Create `.env.local` with your MongoDB URI
2. Start MongoDB (local or use Atlas)
3. Visit `/admin` and upload CSV files

### CSV Upload
- Upload both CSV files from the root directory
- Files are automatically parsed and categorized
- Adult Education sites → 'adult-ed' category
- Youth Programs sites → 'youth' category

### PDF Export
- Click "Export to PDF" in admin panel
- PDF is organized by program with:
  - Program name as header
  - Principal name and email
  - Main address
  - Table of sites with DBN, name, address, hours, assistant principal(s)

## Database Schema

### Site Document
```typescript
{
  _id: ObjectId,
  dbn: string,
  program: string,
  siteName: string,
  status: string,
  buildingAddress: string,
  borough: string,
  zipCode: string,
  businessPhone: string,
  category: 'adult-ed' | 'youth',
  assistantPrincipal: string,
  apEmail: string,
  principal: string,
  principalEmail: string,
  daytimeHours: string,
  eveningHours: string,
  saturdayHours: string,
  // ... other fields from CSV
}
```

## PDF Export Features
- **Program Grouping**: Sites organized by program
- **Smart Formatting**: 
  - Multiple assistant principals split by `/` and joined with `, `
  - Email addresses appended in parentheses
  - Invalid hours filtered out
  - Empty hours show "N/A"
- **Landscape Format**: Optimized for printing
- **Auto-pagination**: New pages added as needed

## Dependencies
- `next`: ^15.0.0
- `react`: ^18.3.1
- `mongodb`: ^6.0.0
- `csv-parse`: ^5.5.0
- `jspdf`: ^2.5.1
- `jspdf-autotable`: ^3.8.2
- `tailwindcss`: ^3.4.14

## Development
- **Dev Server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Start**: `npm start`

## Deploy
Ready for Vercel deployment with MongoDB Atlas.

