var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

var dburl = 'mongodb://54.201.53.120:27017/TweetMap';

/* GET data in the DB initially. */
router.get('/', function(req, res, next) {
	MongoClient.connect(dburl, function(err, db) {
		if(err) {
			console.log('Connecting to DB failed');
			res.send([]);
		} else {
			var col = db.collection('tweets');
			if(col) {
				// only fetch the most recent 2 hrs
				col.find({
					created_at: {$gt: new Date(Date.now() - 2*60*60*1000)}
				}).toArray(function(err, docs) {
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
