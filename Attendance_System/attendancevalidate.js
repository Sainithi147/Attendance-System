// JavaScript to handle the login action
function login() {
    const role = document.getElementById('role').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // Reset error message
    errorMessage.textContent = '';

    // Basic validation
    if (username === '' || password === '') {
        errorMessage.textContent = 'Username and Password cannot be empty!';
        return;
    }

    // Prepare the request body based on the user role
    const loginData = {
        username: username,
        password: password,
        role: role
    };

    // Send a POST request to the backend
    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed');
        }
        return response.json();
    })
    .then(data => {
        if (data.message === 'Login successful') {
            // Check if the logged-in user is an admin or a student
            if (role === 'admin') {
                localStorage.setItem('adminId', data.user.id); // Store admin ID
                window.location.href = 'admin.html'; // Redirect to admin dashboard
            } else {
                // For users, store the studentId in localStorage
                localStorage.setItem('studentId', data.user.id); // Use user ID for attendance fetch
                window.location.href = 'user.html'; // Redirect to user dashboard
            }
        } else {
            errorMessage.textContent = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        errorMessage.textContent = "An error occurred during login. Please try again.";
    });
}

// Event listener for viewing all attendance
document.getElementById('view-all-attendance-button').addEventListener('click', () => {
    window.location.href = 'all-attendance.html'; // Redirect to the attendance page
});
