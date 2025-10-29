# District 79 Directory

A Next.js application for managing and searching District 79 Adult Education and Youth Program sites.

## Features

- **Public Search**: Search for sites by name, address, or program
- **Smart Filters**: Filter by borough, program category, and type
- **Admin Panel**: Easy CSV upload and site management
- **CSV Import**: Simple drag-and-drop to update sites from CSV files

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
│   ├── admin/          # Admin panel page
│   ├── api/            # API routes
│   │   ├── sites/      # Sites CRUD operations
│   │   └── upload/     # CSV upload handler
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home/search page
├── lib/
│   └── mongodb.ts      # MongoDB connection
└── public/             # Static assets
```

## CSV File Format

The application expects CSV files with the following key columns:

**Adult Education:**
- DBN, Program, Site/School Name, Status, Building Address, Borough, Zip Code, Business Phone, Hours of Operation, etc.

**Youth Programs:**
- DBN, Program, Site/School Name, Location Code, Building Address, Borough, Zip Code, Business Phone, Days of Operation, etc.

## API Routes

- `GET /api/sites` - Get all sites
- `POST /api/sites` - Create a new site
- `PUT /api/sites/[id]` - Update a site
- `DELETE /api/sites/[id]` - Delete a site
- `POST /api/upload` - Upload and import CSV file

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MongoDB** - Database
- **csv-parse** - CSV processing

## Deployment

This application is ready to deploy on Vercel. Make sure to:

1. Add your MongoDB connection string to environment variables
2. Connect your GitHub repository to Vercel
3. Deploy!

## License

MIT
