const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer"); 
const path = require("path");
const mysql = require("mysql");
const connection = require("./database");
const json = require('json');
const json5 = require('json5');



const app = express();
app.use(express.json());

app.set("view engine", "ejs");

app.set("views", __dirname);
app.use(bodyParser.urlencoded({ extended: true }));
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});
const upload = multer({ storage: storage });

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/form", function(req, res) {
    res.render("form");
});

app.post("/submit", upload.single('image'), function (req, res) {
    const { firstname, lastname, issue, description_issue, country, state, uniqueCode } = req.body; 
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; 
    const currentTime = now.toLocaleTimeString([], { hour12: false });
    const location = country; 
    const image = req.file ? req.file.path : null; 
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

const uploadsDirectory = path.join(__dirname, 'uploads');
app.use(express.static(uploadsDirectory));
app.get("/Images/:id", function (req, res) {
    const id = req.params.id; 
    const sql = "SELECT Image FROM sustainable1 WHERE unique_id = ?";
    connection.query(sql, [id], function (err, result) {
        if (err) {
            console.error("Error retrieving image:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            if (result.length > 0 && result[0].image) {
                const image = result[0].image;
                res.set('Content-Type', 'image/*'); 
                res.send(image);
            } else {
                res.status(404).send("Image not found");
            }
        }
    });
}); 


app.post("/register", function(req, res) {
    const { username, email, password, district, domain, uniqueId, locations, telegramId } = req.body;
    const area = locations.split(','); 
    const connection = require("./database");

    try {
        const tableName = `${district}${domain}`;
        const tableCheckQuery = `SHOW TABLES LIKE '${tableName}'`;
        connection.query(tableCheckQuery, function(err, results) {
            if (err) {
                console.error("Error checking table existence:", err);
                return res.status(500).send("An error occurred while processing your request.");
            }
            
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
                    
                    insertData();
                });
            } else {
                insertData();
            }
        });
        function insertData() {
            const sql = `INSERT INTO ${tableName} (district, work, code, area, tele) VALUES ?`;
            const values = area.map(area => [district.toLowerCase(), domain.toLowerCase(), uniqueId.toLowerCase(), area.toLowerCase(), telegramId]);
            
            connection.query(sql, [values], function(err, result) {
                if (err) {
                    console.error("Error inserting data:", err);
                    return res.status(500).send("An error occurred while processing your request.");
                }
                
                console.log("Data inserted successfully");
                const userSql = "INSERT INTO user (username, email, password) VALUES (?, ?, ?)";
                connection.query(userSql, [username, email, password], function(err, userResult) {
                    if (err) {
                        console.error("Error inserting user data:", err);
                        return res.status(500).send("An error occurred while processing your request.");
                    }
                    console.log("User data inserted successfully");
                    res.redirect("/confirmation"); 
                });
            });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});

let loggedInUniqueId = null;

app.post("/login", function(req, res) {
    const { uniqueIdSignIn, password } = req.body;
    if (password !== "123") {
        return res.status(401).send("Incorrect password");
    }
    loggedInUniqueId = uniqueIdSignIn;
    const sql = "SELECT * FROM sustainable1 WHERE unique_id = ?";
    connection.query(sql, [uniqueIdSignIn], function (err, rows) {
        if (err) {
            console.error("Error fetching data:", err);
            return res.status(500).send("An error occurred while processing your request.");
        }

        res.render("displayRows", { rows: rows });
    });
});

app.use(express.static('uploads'));
app.get("/complaints", function(req, res) {
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }
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

app.get("/confirmation", function(req, res) {
    res.send("Thank you for your registration! Your data has been successfully submitted.");
});

app.post("/markCompleted", function(req, res) {
    const complaintNumber = req.body.complaintNumber;

    const sql = "UPDATE sustainable1 SET status_issue = 'completed' WHERE complaint_number = ?";
    connection.query(sql, [complaintNumber], function (err, result) {
        if (err) {
            console.error("Error marking issue as completed:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            console.log("Issue marked as completed successfully");
            res.redirect("/");
        }
    });
});

app.post("/markInappropriate", function(req, res) {
    const complaintNumber = req.body.complaintNumber;
    const sql = "UPDATE sustainable1 SET status_issue = 'inappropriate' WHERE complaint_number = ?";
    connection.query(sql, [complaintNumber], function (err, result) {
        if (err) {
            console.error("Error marking issue as inappropriate:", err);
            res.status(500).send("An error occurred while processing your request.");
        } else {
            console.log("Issue marked as inappropriate successfully");
            res.redirect("/"); 
        }
    });
});

app.get("/pending", function(req, res) {
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }
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
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }

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

app.get("/inappropriate", function(req, res) {
    if (!loggedInUniqueId) {
        return res.status(401).send("You must log in first");
    }

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


app.get("/home", function (req, res) {
    // Render the home.ejs file
    res.render("home");
});

app.get('/register', function (req, res) {
    // Render the about.ejs file
    res.render('register');
});

app.get('/services',function (req, res) {
    // Render the services.ejs file
    res.render('services');
});

app.get('/contact', function (req, res)  {
    // Render the contact.ejs file
    res.render('contact');
});




app.listen(3000, function () {
    console.log("App listening on port 3000");
});
