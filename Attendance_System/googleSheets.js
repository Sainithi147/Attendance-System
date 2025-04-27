const { google } = require('googleapis');
const sheets = google.sheets('v4');
const fs = require('fs');

// Load the service account key
const credentials = JSON.parse(fs.readFileSync('D:\\google sheets\\iot-project-440312-26e32f32faa6.json')); // Adjust the path accordingly

// Set up the Google Sheets API
async function connectToGoogleSheets() {
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth;
}

// Fetch register numbers from Google Sheets
async function fetchRegisterNumbers(spreadsheetId, range) {
    const auth = await connectToGoogleSheets();
    const response = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range,
    });
    const rows = response.data.values;
    if (rows && rows.length) {
        return rows.map(row => row[0]);  // Assuming register numbers are in the first column
    } else {
        console.log('No data found.');
        return [];
    }
}

// Clear data in a specified range in Google Sheets
async function clearGoogleSheet(spreadsheetId, range) {
    const auth = await connectToGoogleSheets();
    await sheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range,
    });
    console.log(`Cleared data in range ${range}`);
}

module.exports = { fetchRegisterNumbers, clearGoogleSheet };
