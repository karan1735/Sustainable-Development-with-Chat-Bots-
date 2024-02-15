var express = require("express");
var mysql = require("mysql");
var bodyParser = require("body-parser");
var app = express();
var connection = require('./database');

app.use(bodyParser.urlencoded({ extended: false }));

// Display the form to add a new record
app.get('/add', function(req, res) {
    res.send(`
        <form method="post" action="/add">
            <input type="text" name="district" placeholder="District">
            <input type="text" name="work" placeholder="Work">
            <input type="text" name="code" placeholder="Code">
            <button type="submit">Add Record</button>
        </form>
    `);
});

// Handle the form submission to add a new record
app.post('/add', function(req, res) {
    var district = req.body.district;
    var work = req.body.work;
    var code = req.body.code;

    var insertQuery = "INSERT INTO checking (district, work, code) VALUES (?, ?, ?)";
    connection.query(insertQuery, [district, work, code], function(err, result) {
        if (err) {
            console.error("Error inserting record:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        console.log("Record inserted successfully");
        res.redirect('/');
    });
});

// Display records from the database
app.get('/', function(req, res) {
    let sql = "SELECT * FROM checking";
    connection.query(sql, function(err, result) {
        if (err) {
            console.error("Error fetching data:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        let table = '<table border="1"><tr><th>ID</th><th>Column1</th><th>Column2</th><th>Action</th></tr>';
        result.forEach(function(row) {
            
            table += '<tr>';
            table += '<td>' + row.district + '</td>';
            table += '<td>' + row.work + '</td>';
            table += '<td>' + row.code + '</td>';
            table += '<td><form method="post" action="/delete"><input type="hidden" name="id" value="' + row.id + '"><button type="submit">Delete</button></form></td>';
            table += '</tr>';
        });
        table += '</table>';

        // Add link to the add form
        table += '<a href="/add">Add a Complaint</a>';

        res.send(table);
    });
});

app.listen(3000, function() {
    console.log('App listening on port 3000');
    connection.connect(function(err) {
        if (err) {
            console.error("Error connecting to database:", err);
            return;
        }
        console.log('Database connected:)');
    });
});
