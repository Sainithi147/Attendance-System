# Attendance-System
Attendance System using RFID
Attendance Management System

Overview:
This Attendance Management System is a web application designed for managing student attendance. It allows administrators to view, add, and remove students, as well as update attendance records. Students can log in to view their attendance details.

Features:
- Admin Dashboard:
  - View all students' attendance.
  - Add new students.
  - Remove existing students.
  - Manually update attendance records.

- User Dashboard:
  - View individual student attendance details.

- Login System:
  - Role-based access for Admins and Users.

- Database Integration:
  - MySQL for data storage.
  - Google Sheets integration for attendance updates.

Technologies Used:
- Frontend:
  - HTML, CSS, JavaScript
  - Fetch API for asynchronous requests

- Backend:
  - Node.js with Express framework
  - MySQL for database management
  - Google Sheets API for attendance data management
  - Cron jobs for scheduled tasks

Installation:
1. Clone the repository:
   git clone <repository-url>
   cd <repository-directory>

2. Install dependencies:
   npm install

3. Set up the database:
   - Create a MySQL database named attendance_system.
   - Create tables for students, users, attendance, and Admins as per your schema.

4. Configure Google Sheets API:
   - Create a Google Cloud project and enable the Google Sheets API.
   - Create a service account and download the JSON key file.
   - Update the path in the code to point to your JSON key file.

5. Run the server:
   node server.js

6. Access the application:
   Open your browser and navigate to http://localhost:3000.

Usage:
- Admin Login: Use the admin credentials to access the admin dashboard.
- User Login: Use student credentials to access the user dashboard.
- Attendance Management: Admins can manage student records and attendance through the dashboard.

API Endpoints:
- POST /login: Authenticate users (admin or student).
- GET /get-all-students-attendance: Retrieve all students' attendance data.
- POST /add-student: Add a new student to the database.
- DELETE /remove-student: Remove a student using their register number.
- POST /manual-update-attendance: Manually update attendance records.
