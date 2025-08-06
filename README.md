# Corruption Watch Kenya (CWK)

A web-based anti-corruption reporting and transparency platform designed to empower citizens to report incidents of corruption anonymously, securely, and transparently. It leverages modern web technologies to enhance accountability, public participation, and data integrity in anti-corruption efforts.

## Features

- **Anonymous Reporting**: Secure and anonymous corruption reporting system
- **File Upload**: Support for evidence file uploads (up to 5MB each)
- **Location Tracking**: Interactive map for precise location marking
- **Dashboard Analytics**: Real-time statistics and visualizations
- **Case Tracking**: Follow the progress of submitted reports
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Maps**: Leaflet.js
- **Charts**: Chart.js
- **Deployment**: Vercel

## Project Structure

```
├── index.html              # Landing page
├── Reportpage.html         # Report submission form
├── Dashboard.html          # Analytics dashboard
├── api/
│   ├── report.js          # Report submission API
│   └── get-reports.js     # Dashboard data API
├── package.json           # Dependencies
└── vercel.json           # Vercel configuration
```

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create a new Supabase project
   - Go to SQL Editor in your Supabase dashboard
   - **Recommended**: Run `complete-setup.sql` (handles all issues)
   - Or use `supabase-setup-simple.sql` for basic setup
   - Or use `supabase-setup.sql` for more secure RLS-enabled setup
               - If you encounter schema exposure errors, use `fix-postgrest-final.sql` (FINAL solution for PostgREST errors)
        - Or use `fix-postgrest-exposure.sql` for basic PostgREST issues
        - Or use `fix-schema-exposure.sql` for general schema issues
   - If you encounter column errors, use `fix-missing-column.sql` to add missing columns
   - Or use `check-table.sql` to completely recreate the table
   - Get your project URL and keys from Settings > API
4. Set up environment variables (optional):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (recommended)
5. Deploy to Vercel or run locally

## Deploying to GitHub Pages or Static Hosting

- **index.html** and **Reportpage.html** work out-of-the-box as static files. All scripts must use explicit version numbers (no wildcards) and be loaded before your custom code.
- **Dashboard.html** will NOT show live analytics on GitHub Pages unless you refactor it to fetch data directly from Firebase (not from `/api` endpoints). GitHub Pages does not support serverless functions or backend APIs.
- If you want dashboard analytics on GitHub Pages, update Dashboard.html to use the Firebase client SDK to fetch and display data.
- All backend/serverless API endpoints (in `/api`) require a platform like Vercel, Netlify, or your own Node.js server.

**Tips for static hosting:**
- Always use full version numbers in your `<script src=...>` tags (e.g., `firebasejs/10.12.2/...`).
- Place all library scripts before your custom scripts.
- Test your site after deployment and check the browser console for any missing scripts or errors.

## Live Demo

Visit: https://corruption-watch-kenya-lws6-gvkk6ay3t.vercel.app/

## Contributing

This project is designed to help combat corruption in Kenya. Contributions are welcome!
