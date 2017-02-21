var express = require('express');
var router = express.Router();
var db = require("../database.js");

/* GET users listing. */
router.get('/', function(req, res, next) {
	console.log("okkk");
	db.Users.find({}, function (err, results) {
		res.send(results);
	});
});

/** Create user */
router.post('/', function(req, res, next) {
	db.Users.findOne({email: req.body.email}, function (err, row) {
		if(err) {
			res.send(err);
			return;
		}
		if(!row) {
			var user = new db.Users({
				name: req.body.name,
				email: req.body.email
			});
			user.save(function (err, results) {
				if(err) {
					res.send(err); 
					return;
				}
				console.log("SAVED >>> ", results);
				db.Users.findOne({email: req.body.email}, function (err, row) {
					if(err) {
						res.send(err); 
						return;
					}
					res.send(row);
				});
			});
		} else {
			console.log("EXISTING >>> ", row);
			res.send(row);
		}
	});
});

module.exports = router;
