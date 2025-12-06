# CheckMate

CheckMate is a comprehensive classroom management and attendance tracking application designed for teachers and students. It streamlines class organization, attendance management, seating arrangements, and student engagement through an intuitive interface.

## Features

### For Teachers
- **Class Management**: Create and manage multiple classes with unique join codes
- **QR Code Generation**: Generate QR codes for easy class joining
- **Attendance Tracking**: Mark attendance with multiple status options (Present, Absent, Late, Excused)
- **Seating Charts**: Create and manage customizable seating arrangements
- **Student Analytics**: View detailed attendance statistics and class performance
- **Events & Reminders**: Schedule class events, exams, and deadlines
- **Student Communication**: Contact students directly through the platform

### For Students
- **Easy Class Joining**: Join classes using codes or QR code scanning
- **QR Code Scanning**: Scan QR codes via camera or upload image
- **Attendance History**: View personal attendance records
- **Class Calendar**: Stay updated with upcoming events and deadlines
- **Seating View**: See your assigned seat in the classroom
- **Notifications**: Receive reminders and announcements

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Convex (Real-time database)
- **Authentication**: Convex Auth
- **QR Code**: qrcode (generation) + html5-qrcode + jsQR (scanning)
- **Routing**: React Router

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Convex account (for backend)

### Installation

1. **Clone the repository**
```sh
git clone https://github.com/gabbiehub/checkmate.git
cd checkmate
```

2. **Install dependencies**
```sh
npm install
```

3. **Set up Convex**
```sh
npx convex dev
```
This will prompt you to log in and configure Convex for the first time.

4. **Start the development server**
```sh
npm run dev
```

The app will be available at `http://localhost:5173`

**Note**: You need both the Convex backend (`npx convex dev`) and the Vite frontend (`npm run dev`) running simultaneously in separate terminals.

## Project Structure

```
checkmate/
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui components
│   │   └── ...        # Feature components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts (Auth, etc.)
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility functions
├── convex/            # Convex backend
│   ├── schema.ts      # Database schema
│   ├── classes.ts     # Class-related functions
│   ├── users.ts       # User management
│   └── ...
└── public/            # Static assets
```

## Usage

### As a Teacher
1. Sign up/Login with your email
2. Create a new class from the dashboard
3. Share the class code or QR code with students
4. Mark attendance, manage seating, and track analytics

### As a Student
1. Sign up/Login with your email
2. Join a class using the class code or by scanning the QR code
3. View your attendance, classes, and upcoming events

## QR Code Features

### Generating QR Codes (Teachers)
- Navigate to your class view
- Click the QR code icon
- Download or share the QR code with students

### Scanning QR Codes (Students)
- Click "Join Class" 
- Choose "QR Scan" tab
- **Open Camera**: Use your device camera (requires HTTPS)
- **Upload Image**: Upload a screenshot/photo of the QR code

## Deployment

The application can be deployed to any static hosting service that supports:
- Node.js build process
- Environment variables for Convex
- HTTPS (required for camera access)

Recommended platforms:
- Vercel
- Netlify
- GitHub Pages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
