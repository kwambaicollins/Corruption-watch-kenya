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
3. Set up environment variables (optional):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
4. Deploy to Vercel or run locally

## Live Demo

Visit: https://corruption-watch-kenya-lws6-gvkk6ay3t.vercel.app/

## Contributing

This project is designed to help combat corruption in Kenya. Contributions are welcome!
