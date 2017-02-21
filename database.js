var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect("mongodb://localhost:27017/audioVideoCalling");

mongoose.connection.once('open', function () {
    console.log("Connected to database."); 
});

mongoose.connection.on('connecting', function() {
    console.log('connecting to MongoDB...');
    Mail.notify({subject: "ATTEMPTING TO CONNECT MONGODB", content: "Connecting to MongoDB..."})
});

// Log error if not connected
mongoose.connection.on('error', function () {
    if (process.env.ENV_TYPE !== "LOCAL") {
        Mail.notifyError({ subject: "Database Connection Failed", content: "Database Connection Failed." }, function () {

        });
    }
});

var db = {};

/** USERS SCHEMA */
var usersSchema = Schema({
    name: String,
    email: String,
    status: {
        type: String,
        enum: ['online', 'offline', 'idle'],
        default: "offline"
    },
    sockets: Array,
}, {
        versionKey: false
    });

/** Users Table */
db.Users = mongoose.model('users', usersSchema);

module.exports = db;