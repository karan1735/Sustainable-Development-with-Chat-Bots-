const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer"); // Require multer
const path = require("path");
const mysql = require("mysql");
const connection = require("./database");
const app = express();

// Set the view engine to use EJS
app.set("view engine", "ejs");

// Set the directory for the views
app.set("views", __dirname);

// Body parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Multer middleware setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    }
});
const upload = multer({ storage: storage });

// Route for the homepage with two buttons
app.get("/", function (req, res) {
    res.render("index");
});

// Route for the registration form
app.get("/register", function(req, res) {
    res.render("register");
});

// Route for the complaint form
app.get("/form", function(req, res) {
    res.render("form");
});


// Route to serve the form page
app.get("/", function (req, res) {
    res.render("form");
});

// Route to handle form submission
app.post("/submit", upload.single('image'), function (req, res) {
    const { firstname, lastname, issue, description_issue, country, state } = req.body;
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Extracts date in format YYYY-MM-DD
    const currentTime = now.toLocaleTimeString([], { hour12: false });
    const location = country; // Store only the country in location
    const image = req.file ? req.file.path : null; // Get the path of the uploaded image
    const sql = "INSERT INTO sustainable1 (firstname, lastname, issue, description_issue, date_of_complaint, time_of_complaint, location, area, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    connection.query(sql, [firstname, lastname, issue, description_issue, currentDate, currentTime, location, state, image], function (err, result) {
        if (err) {
            console.error("Error inserting data:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            console.log("Data inserted successfully");
            res.redirect("/");
        }
    });
});

app.get("/image/:id", function (req, res) {
    const id = req.params.id; // Retrieve the ID of the image
    const sql = "SELECT image FROM sustainable1 WHERE id = ?";
    connection.query(sql, [id], function (err, result) {
        if (err) {
            console.error("Error retrieving image:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            if (result.length > 0 && result[0].image) {
                const image = result[0].image; // Get the image data from the database
                // Set appropriate headers and send the image data as a response
                res.set('Content-Type', 'image/*'); // Adjust content type based on image format
                res.send(image);
            } else {
                res.status(404).send("Image not found");
            }
        }
    });
});
// Update the route for the registration form
app.get("/register", function(req, res) {
    res.render("register");
});

// Handle registration form submission
app.post("/register", function(req, res) {
    const { district, domain, uniqueId, locations, telegramId } = req.body;
    const area = locations.split(','); // Convert comma-separated locations to an array

    // Connect to the MySQL database
    const connection = require("./database");

    try {
        // Check if the table exists
        const tableName = `${district}${domain}`;
        const tableCheckQuery = `SHOW TABLES LIKE '${tableName}'`;
        connection.query(tableCheckQuery, function(err, results) {
            if (err) {
                console.error("Error checking table existence:", err);
                return res.status(500).send("An error occurred while processing your request.");
            }
            
            // If the table doesn't exist, create it
            if (results.length === 0) {
                const createTableQuery = `CREATE TABLE ${tableName} (
                    district VARCHAR(255),
                    work VARCHAR(255),
                    code VARCHAR(255),
                    area VARCHAR(255),
                    tele VARCHAR(255)
                )`;
                connection.query(createTableQuery, function(err, results) {
                    if (err) {
                        console.error("Error creating table:", err);
                        return res.status(500).send("An error occurred while processing your request.");
                    }
                    
                    // Insert data into the newly created table
                    insertData();
                });
            } else {
                // If the table exists, insert data directly
                insertData();
            }
        });

        // Function to insert data into the table
        function insertData() {
            const sql = `INSERT INTO ${tableName} (district, work, code, area, tele) VALUES ?`;
            const values = area.map(area => [district.toLowerCase(), domain.toLowerCase(), uniqueId.toLowerCase(), area.toLowerCase(), telegramId]);
            
            connection.query(sql, [values], function(err, result) {
                if (err) {
                    console.error("Error inserting data:", err);
                    return res.status(500).send("An error occurred while processing your request.");
                }
                
                console.log("Data inserted successfully");
                res.redirect("/confirmation"); // Redirect to confirmation page
            });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});


// Define a route for "/confirmation"
app.get("/confirmation", function(req, res) {
    // Render a confirmation page or handle the request accordingly
    res.send("Thank you for your registration! Your data has been successfully submitted.");
});

app.listen(3000, function () {
    console.log("App listening on port 3000");
});
