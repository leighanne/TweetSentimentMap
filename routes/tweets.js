var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

var dburl = 'mongodb://52.11.124.218:27017/TweetMap';

/* GET data in the DB initially. */
router.get('/', function(req, res, next) {
	MongoClient.connect(dburl, function(err, db) {
		if(err) {
			console.log('Connecting to DB failed');
			res.send([]);
		} else {
			var col = db.collection('tweets');
			if(col) {
				col.find({}).toArray(function(err, docs) {
					if(err) {
						console.log('Fetching documents failed');
						res.send([]);
					} else {
						res.send(docs);
					}
				});
			} else {
				res.send([]);
			}
		}
	});
});

module.exports = router;
