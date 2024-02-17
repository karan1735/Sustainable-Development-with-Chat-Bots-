const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer"); // Require multer
const path = require("path");
const mysql = require("mysql");
const connection = require("./database");
const json = require('json');
const json5 = require('json5');

const app = express();
app.use(express.json());

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

// Route to handle form submission
app.post("/submit", upload.single('image'), function (req, res) {
    const { firstname, lastname, issue, description_issue, country, state, uniqueCode } = req.body; // Add uniqueCode here
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // Extracts date in format YYYY-MM-DD
    const currentTime = now.toLocaleTimeString([], { hour12: false });
    const location = country; // Store only the country in location
    const image = req.file ? req.file.path : null; // Get the path of the uploaded image
    const sql = "INSERT INTO sustainable1 (firstname, lastname, issue, description_issue, date_of_complaint, time_of_complaint, location, area, image, unique_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; // Include unique_id field
    connection.query(sql, [firstname, lastname, issue, description_issue, currentDate, currentTime, location, state, image, uniqueCode], function (err, result) { // Pass uniqueCode to the query
        if (err) {
            console.error("Error inserting data:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            console.log("Data inserted successfully");
            res.redirect("/");
        }
    });
});

// Route to serve the image
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

// Route to handle registration form submission
app.post("/register", function(req, res) {
    const { username, email, password, district, domain, uniqueId, locations, telegramId } = req.body;
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
                // Insert user data into 'user' table
                const userSql = "INSERT INTO user (username, email, password) VALUES (?, ?, ?)";
                connection.query(userSql, [username, email, password], function(err, userResult) {
                    if (err) {
                        console.error("Error inserting user data:", err);
                        return res.status(500).send("An error occurred while processing your request.");
                    }
                    console.log("User data inserted successfully");
                    res.redirect("/confirmation"); // Redirect to confirmation page
                });
            });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

// Route to handle sign-in request
let loggedInUniqueId = null;

// Route for handling login
app.post("/login", function(req, res) {
    const { uniqueIdSignIn, password } = req.body;

    // Check if the password matches the default password (change this to a secure authentication mechanism)
    if (password !== "123") {
        return res.status(401).send("Incorrect password");
    }

    // Store the logged-in unique ID for later use
    loggedInUniqueId = uniqueIdSignIn;

    // Query the database to fetch rows based on the provided unique ID
    const sql = "SELECT * FROM sustainable1 WHERE unique_id = ?";
    connection.query(sql, [uniqueIdSignIn], function (err, rows) {
        if (err) {
            console.error("Error fetching data:", err);
            return res.status(500).send("An error occurred while processing your request.");
        }

        // Render a page to display the fetched rows
        res.render("displayRows", { rows: rows });
    });
});

// Route for displaying complaints using the same unique ID used during login
app.get("/complaints", function(req, res) {
    // Ensure a unique ID has been logged in before accessing complaints
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }

    // Query the database to fetch all complaints for the logged-in unique ID
    const sql = "SELECT * FROM sustainable1 WHERE unique_id = ?";
    connection.query(sql, [loggedInUniqueId], function (err, rows) {
        if (err) {
            console.error("Error fetching complaints:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            res.render("displayRows", { rows: rows });
        }
    });
});




// Define a route for "/confirmation"
app.get("/confirmation", function(req, res) {
    // Render a confirmation page or handle the request accordingly
    res.send("Thank you for your registration! Your data has been successfully submitted.");
});

// Route to mark an issue as completed
// Route to mark an issue as completed
app.post("/markCompleted", function(req, res) {
    const complaintNumber = req.body.complaintNumber;

    // Update the status_issue column in the database for the specified complaint number to "completed"
    const sql = "UPDATE sustainable1 SET status_issue = 'completed' WHERE complaint_number = ?";
    connection.query(sql, [complaintNumber], function (err, result) {
        if (err) {
            console.error("Error marking issue as completed:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            console.log("Issue marked as completed successfully");
            res.redirect("/"); // Redirect to the homepage or wherever appropriate
        }
    });
});

// Route to mark an issue as inappropriate
app.post("/markInappropriate", function(req, res) {
    const complaintNumber = req.body.complaintNumber;

    // Update the status_issue column in the database for the specified complaint number to "inappropriate"
    const sql = "UPDATE sustainable1 SET status_issue = 'inappropriate' WHERE complaint_number = ?";
    connection.query(sql, [complaintNumber], function (err, result) {
        if (err) {
            console.error("Error marking issue as inappropriate:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            console.log("Issue marked as inappropriate successfully");
            res.redirect("/"); // Redirect to the homepage or wherever appropriate
        }
    });
});



// Route for displaying pending complaints
app.get("/pending", function(req, res) {
    // Ensure a unique ID has been logged in before accessing pending complaints
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }

    // Query the database to fetch pending complaints for the logged-in unique ID
    const sql = "SELECT * FROM sustainable1 WHERE unique_id = ? AND status_issue = 'pending'";
    connection.query(sql, [loggedInUniqueId], function(err, rows) {
        if (err) {
            console.error("Error fetching pending complaints:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            res.render("displayRows", { rows: rows });
        }
    });
});

app.get("/completed", function(req, res) {
    // Ensure a unique ID has been logged in before accessing completed complaints
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }

    // Query the database to fetch completed complaints for the logged-in unique ID
    const sql = "SELECT * FROM sustainable1 WHERE unique_id = ? AND status_issue = 'completed'";
    connection.query(sql, [loggedInUniqueId], function(err, rows) {
        if (err) {
            console.error("Error fetching completed complaints:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            res.render("displayRows", { rows: rows });
        }
    });
});

// Route for fetching inappropriate complaints using the same unique ID used during login
app.get("/inappropriate", function(req, res) {
    // Ensure a unique ID has been logged in before accessing inappropriate complaints
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }

    // Query the database to fetch inappropriate complaints for the logged-in unique ID
    const sql = "SELECT * FROM sustainable1 WHERE unique_id = ? AND status_issue = 'inappropriate'";
    connection.query(sql, [loggedInUniqueId], function(err, rows) {
        if (err) {
            console.error("Error fetching inappropriate complaints:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            res.render("displayRows", { rows: rows });
        }
    });
});


app.listen(3000, function () {
    console.log("App listening on port 3000");
});
