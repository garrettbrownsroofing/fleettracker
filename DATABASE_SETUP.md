# Database Setup Guide

Your fleet tracker has been configured to work with Google Cloud databases. Here's how to set it up:

## Database Options

### Option 1: Firestore (Recommended for simplicity)
- **Pros**: NoSQL, serverless, automatic scaling, easy setup
- **Cons**: More expensive for complex queries, limited SQL features

### Option 2: Cloud SQL (PostgreSQL)
- **Pros**: Full SQL support, relational data integrity, familiar SQL syntax
- **Cons**: More complex setup, requires connection management

## Setup Instructions

### For Firestore:

1. **Create a Google Cloud Project** (if you haven't already)
2. **Enable Firestore API**
3. **Create a Firestore database** in your project
4. **Set environment variables**:
   ```bash
   DB_TYPE=firestore
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

### For Cloud SQL (PostgreSQL):

1. **Create a Cloud SQL PostgreSQL instance**
2. **Create a database** within the instance
3. **Set up authentication** (service account or user/password)
4. **Set environment variables**:
   ```bash
   DB_TYPE=postgres
   DATABASE_URL=postgresql://username:password@host:port/database
   # OR
   DB_HOST=your-cloud-sql-instance-ip
   DB_PORT=5432
   DB_NAME=your-database-name
   DB_USER=your-username
   DB_PASSWORD=your-password
   ```

## Local Development

1. **Copy environment file**:
   ```bash
   cp env.example .env.local
   ```

2. **Fill in your database credentials** in `.env.local`

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **For Firestore**: Download service account key and set:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## Production Deployment (Vercel)

1. **Set environment variables** in Vercel dashboard:
   - Go to your project settings
   - Add all required environment variables
   - For Firestore, you can use Vercel's built-in Google Cloud integration

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## Database Initialization

The database will be automatically initialized when you first access the API endpoints. You can also manually initialize by calling:

```
GET /api/init
```

## Data Storage Capacity

### Firestore:
- **Document size limit**: 1MB per document
- **Collection size**: No limit
- **Total storage**: Scales automatically
- **Cost**: Pay per read/write operation and storage

### Cloud SQL:
- **Storage**: Depends on your instance size (can be terabytes)
- **Performance**: Scales with instance size
- **Cost**: Fixed monthly cost based on instance size

## Migration from File Storage

Your existing data structure is compatible with both database options. The API endpoints have been updated to use the database instead of local files.

## Troubleshooting

### Common Issues:

1. **Authentication errors**: Make sure your service account has the correct permissions
2. **Connection timeouts**: Check your Cloud SQL instance is running and accessible
3. **Environment variables**: Ensure all required variables are set correctly

### Testing Connection:

Visit `/api/init` to test your database connection and initialization.

## Data Types Supported

The database supports all your existing data types:
- Vehicles
- Drivers  
- Assignments
- Maintenance Records
- Odometer Logs
- Receipts
- Cleanliness Logs

All relationships and data integrity are maintained.
