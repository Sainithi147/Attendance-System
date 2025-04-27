const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const { fetchRegisterNumbers, clearGoogleSheet } = require('D:\\iot project\\attendancedatabase\\googleSheets.js'); // Import your functions
const cron = require('node-cron'); // For scheduling tasks

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());

// MySQL connection setup
const connection = mysql.createConnection({
    host: 'localhost', // Replace with your MySQL host
    user: 'root', // Replace with your MySQL username
    password: 'Fred@2005', // Replace with your MySQL password
    database: 'attendance_system' // Replace with your database name
});

// Connect to the MySQL database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

// Endpoint to check username and password
app.post('/login', (req, res) => {
    const { username, password, role } = req.body;

    const tableName = role === 'admin' ? 'Admins' : 'Users';

    const query = `SELECT * FROM ${tableName} WHERE username = ? AND password = ?`;
    connection.query(query, [username, password], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            return res.json({ message: 'Login successful', user: results[0] });
        } else {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
    });
});

// Endpoint to get user attendance along with name and register number
app.get('/get-user-attendance/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const query = `
        SELECT s.name, s.register_num, 
               COUNT(a.id) AS totalClasses, 
               SUM(a.attended) AS attendedClasses 
        FROM students s 
        LEFT JOIN attendance a ON s.id = a.student_id 
        WHERE s.id = ?`;

    connection.query(query, [studentId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            const student = results[0];
            const totalClasses = student.totalClasses || 0;
            const attendedClasses = student.attendedClasses || 0;
            const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

            return res.json({
                name: student.name,
                registerNum: student.register_num,
                totalClasses,
                attendedClasses,
                attendancePercentage: attendancePercentage.toFixed(2) // Rounded to 2 decimal places
            });
        } else {
            return res.status(404).json({ message: 'No attendance records found' });
        }
    });
});

// Function to update attendance
async function updateAttendance() {
    const spreadsheetId = '1XJyfCcY-U1hxxADsIQOjSUjeqp1vWdVFLl2h_5dir-A'; // Replace with your Google Sheets ID
    const range = 'Sheet1!A:A'; // Adjust the range if needed

    try {
        const registerNumbers = await fetchRegisterNumbers(spreadsheetId, range);
        if (registerNumbers.length === 0) {
            console.warn('No register numbers fetched from Google Sheets.');
            return; // Early return if no register numbers found
        }
 
        registerNumbers.forEach((registerNum) => {
            const query = `INSERT INTO attendance (student_id, attendance_date, attended) 
                           VALUES ((SELECT id FROM students WHERE register_num = ?), CURDATE(), TRUE)
                           ON DUPLICATE KEY UPDATE attended = TRUE`;
            connection.query(query, [registerNum], (err) => {
                if (err) {
                    console.error(`Error inserting/updating attendance for ${registerNum}:`, err);
                }
            });
        });

        console.log('Attendance updated successfully!');
    } catch (error) {
        console.error('Error updating attendance:', error);
    }
}

// Schedule attendance update and Google Sheet clearing at 6:35 PM every day
cron.schedule('35 18 * * *', async () => {
    console.log('Running daily attendance update at 6:35 PM');

    try {
        await updateAttendance();  // Update attendance from Google Sheets
        console.log('Attendance updated successfully via cron job.');
        
        await clearGoogleSheet('1XJyfCcY-U1hxxADsIQOjSUjeqp1vWdVFLl2h_5dir-A', 'Sheet1!A2:A'); // Clear data except header row
        console.log('Google Sheet cleared successfully via cron job.');
    } catch (error) {
        console.error('Error during scheduled attendance update:', error);
    }
});

// Manual update attendance endpoint
app.post('/manual-update-attendance', async (req, res) => {
    try {
        await updateAttendance();
        await clearGoogleSheet('1XJyfCcY-U1hxxADsIQOjSUjeqp1vWdVFLl2h_5dir-A', 'Sheet1!A2:A'); // Clear data except for the header
        res.json({ message: 'Attendance updated and Google Sheet cleared successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update attendance' });
    }
});

// Endpoint to add a new student
app.post('/add-student', (req, res) => {
    const { username, password, name, email, register_num, phone_no } = req.body;

    // Insert into students table
    const studentQuery = `INSERT INTO students (name, email, phone_no, register_num) VALUES (?, ?, ?, ?)`;
    connection.query(studentQuery, [name, email, phone_no, register_num], (error, studentResults) => {
        if (error) {
            return res.status(500).json({ error: 'Database error while inserting student details' });
        }
        
        // Insert into users table, linking to the student's ID
        const userQuery = `INSERT INTO users (username, password, student_id) VALUES (?, ?, ?)`;
        const studentId = studentResults.insertId; // Get the generated student ID
        
        connection.query(userQuery, [username, password, studentId], (userError, userResults) => {
            if (userError) {
                return res.status(500).json({ error: 'Database error while inserting user details' });
            }
            res.json({ message: 'Student and user added successfully!' });
        });
    });
});


// Endpoint to get all students' attendance
app.get('/get-all-students-attendance', (req, res) => {
    const query = `
        SELECT s.name, s.register_num, 
               COUNT(a.id) AS totalClasses, 
               SUM(a.attended) AS attendedClasses 
        FROM students s 
        LEFT JOIN attendance a ON s.id = a.student_id 
        GROUP BY s.id`;
        
    connection.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }
        const attendanceData = results.map(student => {
            const totalClasses = student.totalClasses || 0;
            const attendedClasses = student.attendedClasses || 0;
            const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
            return {
                name: student.name,
                register_num: student.register_num,
                attendance_percentage: attendancePercentage.toFixed(2) // Rounded to 2 decimal places
            };
        });
        res.json(attendanceData);
    });
});

// Endpoint to remove a student
app.delete('/remove-student', (req, res) => {
    const { register_num } = req.body; // Get the register number from the request body

    if (!register_num) {
        return res.status(400).json({ message: 'Register number is required.' });
    }

    const sql = 'DELETE FROM students WHERE register_num = ?'; // SQL query to delete student

    db.query(sql, [register_num], (err, result) => {
        if (err) {
            console.error('Error deleting student:', err);
            return res.status(500).json({ message: 'Failed to delete student.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        res.status(200).json({ message: 'Student removed successfully.' });
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
