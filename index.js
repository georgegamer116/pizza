const mysql = require('mysql');

// Create connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'johnmarc_johnmarco',
  password: 'Sm7DLnR55E6nrwYRdYNM',
  database: 'johnmarc_johnmarco'
});

// Connect
connection.connect(err => {
  if (err) {
    return console.error('Error connecting: ' + err.stack);
  }
  console.log('Connected to MySQL as ID ' + connection.threadId);
  console.log("<h1>connected</h1>");
});

// Example query
connection.query('SELECT NOW()', (err, results) => {
  if (err) throw err;
  console.log('Server time:', results[0]);
});

// Close
connection.end();
