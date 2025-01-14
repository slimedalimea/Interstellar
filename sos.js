const fs = require('fs');
const path = require('path');

// Define the path to the config.js file
const filePath = path.join(__dirname, 'config.js');

// Function to handle the file deletion
function handleFileDeletion(req, res) {
    if (req.method === 'GET' && req.url === '/delete-config') {
        // Attempt to delete the config.js file
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Failed to delete file:', err);
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('Failed to delete file.');
            } else {
                console.log('File deleted successfully');
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end('File deleted successfully.');
            }
        });
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Not Found');
    }
}

module.exports = handleFileDeletion;
