# Frontend Setup Guide

## Environment Configuration

Create a `.env.local` file in the `davefront` directory with the following content:

```bash
VITE_API_URL=http://localhost:8000
```

## Running the Frontend

1. Install dependencies (already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The frontend will be available at `http://localhost:5173`

## Backend Requirements

Make sure the FastAPI backend is running on port 8000 before using the frontend.

## Features

- Modern chat interface with shadcn/ui components
- Real-time message updates
- Error handling and loading states
- Responsive design
- TypeScript support for type safety
