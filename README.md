# District 79 Directory

A Next.js application for managing and searching District 79 Adult Education and Youth Program sites.

## Features

### Public Features
- **Public Search**: Search for sites by name, address, or program
- **Smart Filters**: Filter by borough, program category, and type
- **Interactive Map**: View sites on an interactive map with clustering and color-coded pins
- **Site Details**: View detailed information for each site including map location
- **Status Filtering**: Only open sites are displayed in public views

### Admin Features
- **CSV Import with Preview**: Preview changes before importing with detailed before/after comparisons
- **Address Normalization**: Automatic standardization of NYC addresses (handles numbered streets, abbreviations, etc.)
- **Bulk Operations**: 
  - Bulk geocode addresses
  - Bulk generate AI descriptions
  - Bulk normalize addresses
- **AI Description Generation**: Generate program descriptions using GPT-5
- **Site Management**: Edit, delete, and manage sites with full CRUD operations
- **Change Requests**: Review and manage user-submitted change requests
- **Protected Fields**: Latitude, longitude, and descriptions are protected from CSV overwrites

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```
MONGODB_URI=your_mongodb_connection_string
MAPBOX_ACCESS_TOKEN=your_mapbox_token (optional, for map features)
OPENAI_API_KEY=your_openai_api_key (optional, for AI description generation)

# Google OAuth (for SSO)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback (or your production URL)
GOOGLE_ALLOWED_DOMAINS=schools.nyc.gov (comma-separated list of allowed email domains)
NEXT_PUBLIC_GOOGLE_ENABLED=true (set to 'true' to enable Google Sign-In)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)

# JWT Secret (required for authentication)
JWT_SECRET=your_jwt_secret_key (generate a secure random string)

# Admin Password (fallback authentication, optional if using Google OAuth)
ADMIN_PASSWORD=your_admin_password (optional if Google OAuth is enabled)
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. Go to the admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)
2. Upload the CSV files from the root directory:
   - `District 79 Site List - 25-26 SY(Adult Ed).csv`
   - `District 79 Site List - 25-26 SY(Youth Programs).csv`
3. Start searching for sites on the home page!

## Project Structure

```
district79-directory/
├── app/
│   ├── admin/          # Admin panel pages
│   │   ├── page.tsx    # Main admin dashboard
│   │   ├── import/     # CSV import with preview
│   │   └── edit/[id]   # Edit site page
│   ├── api/            # API routes
│   │   ├── sites/      # Sites CRUD operations
│   │   │   ├── normalize-addresses  # Normalize addresses
│   │   │   └── geocode-all         # Bulk geocoding
│   │   ├── upload/     # CSV upload handlers
│   │   │   ├── preview  # Preview CSV changes
│   │   │   └── import   # Import CSV with updates
│   │   ├── generate-description      # Single description generation
│   │   └── generate-descriptions-bulk # Bulk description generation
│   ├── map/            # Interactive map page
│   ├── site/[id]       # Individual site details page
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home/search page
├── components/
│   ├── SiteMap.tsx     # Interactive map component
│   ├── StaticMap.tsx   # Static map for site details
│   └── admin/          # Admin-specific components
├── lib/
│   ├── mongodb.ts          # MongoDB connection
│   ├── geocode.ts          # Geocoding utilities
│   └── address-normalize.ts # NYC address normalization
└── public/             # Static assets
```

## CSV Import Features

### Preview Before Import
The CSV import page (`/admin/import`) allows you to:
- Preview all changes before importing
- See which sites will be added, updated, or removed
- View detailed before/after comparisons for each field
- Selectively remove sites not in the CSV

### Smart Matching
- Sites are matched by **Site/School Name** (case-insensitive)
- Existing sites are updated rather than duplicated
- Protected fields (latitude, longitude, description) are never overwritten

### Address Normalization
- Addresses are automatically normalized during import
- Handles NYC-specific formats (numbered streets like "20 Avenue")
- Standardizes abbreviations (St → Street, Ave → Avenue, etc.)
- Use "Normalize All Addresses" button to fix existing addresses

### CSV File Format

The application expects CSV files with the following key columns:

**Adult Education:**
- DBN, Program, Site/School Name, Status, Building Address, Borough, Zip Code, Business Phone, Hours of Operation, etc.

**Youth Programs:**
- DBN, Program, Site/School Name, Location Code, Building Address, Borough, Zip Code, Business Phone, Days of Operation, etc.

## API Routes

### Sites
- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create a new site
- `PUT /api/sites/[id]` - Update a site
- `DELETE /api/sites/[id]` - Delete a site
- `POST /api/sites/normalize-addresses` - Normalize all addresses
- `POST /api/sites/geocode-all` - Geocode all sites without coordinates

### CSV Import
- `POST /api/upload` - Upload and import CSV file (legacy, replaces category)
- `POST /api/upload/preview` - Preview CSV changes before importing
- `POST /api/upload/import` - Import CSV with upsert logic (matches by Site Name)

### AI Features
- `POST /api/generate-description` - Generate description for a single site
- `POST /api/generate-descriptions-bulk` - Generate descriptions for multiple sites

### Other
- `GET /api/mapbox-token` - Get Mapbox access token
- `GET /api/change-requests` - Get all change requests
- `POST /api/change-requests` - Create a change request

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MongoDB** - Database
- **Mapbox GL JS** - Interactive maps
- **OpenAI GPT-5** - AI description generation
- **csv-parse** - CSV processing
- **jsPDF** - PDF export functionality

## Key Features Details

### Address Normalization
The application includes a sophisticated NYC address normalization system that:
- Handles numbered streets (e.g., "5800 20 Avenue" → "5800 20 Avenue")
- Standardizes street abbreviations (St, Ave, Blvd, etc.)
- Normalizes directional prefixes (N, S, E, W)
- Preserves ordinal numbers (1st, 2nd, 3rd, etc.)
- Works with NYC GeoSearch API for complex addresses

### AI Description Generation
- Uses OpenAI GPT-5 for generating program descriptions
- Bulk generation with rate limiting
- Customizable prompts for consistent tone
- Select specific sites or generate for all sites without descriptions

### Map Features
- Interactive map with clustering for performance
- Color-coded pins for 17 different programs
- Popups with site details and links
- Static maps for individual site pages
- Filter by program and category

### Protected Fields
During CSV import, the following fields are protected and never overwritten:
- `latitude` - Geocoded coordinates
- `longitude` - Geocoded coordinates  
- `description` - AI-generated or manually entered descriptions

## Authentication

The application uses different authentication methods for different user types:

### Public Users (Homepage)
- **Google OAuth SSO**: Single Sign-On using your organization's Google Workspace
- Sign in button appears in the header
- Only users with authorized email domains can sign in
- No password required
- Secure and easy to manage
- Allows tracking of who is using the directory

**Setup Instructions**: See [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) for detailed setup steps.

### Admin Users
- **Password Authentication**: Traditional password-based authentication
- Used exclusively for admin panel access (`/admin`)
- Set `ADMIN_PASSWORD` in environment variables
- Google OAuth is NOT used for admin access
- Separate authentication system from public users

## Deployment

This application is ready to deploy on Vercel. Make sure to:

1. Add all required environment variables (see Installation section)
2. Configure Google OAuth in Google Cloud Console (see [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md))
3. Add production redirect URI to Google OAuth credentials
4. Connect your GitHub repository to Vercel
5. Add all environment variables to Vercel dashboard
6. Deploy!

## License

Private
