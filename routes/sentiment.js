var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var dburl = 'mongodb://54.201.53.120:27017/TweetMap';

var http = require('http');

router.post('/', function(req, res, next) {
	if(req.get('x-amz-sns-message-type') == 'Notification') {
		console.log('SNS received');
		var tweet_id = req.body.Message._id;
		// extract sentiment info from DB
		MongoClient.connect(dburl, function(err, db) {
			if(err) {
				console.log('Connecting to DB failed');
			} else {
				var col = db.collection('tweets');
				if(col) {
					col.findOne({_id: new ObjectID(tweet_id)}, function(err, doc) {
						if(err) {
							console.log('Fetching documents failed');
						} else {
							var data = {}
							data._id = doc._id.toHexString();
							data.sentiment = doc.sentiment;
							// send sentiment to clients
							var io = global.socketio;
							io.emit('sentiment', data);
						}
					});
				} else {
					console.log('Connecting to Collection failed');
				}
			}
		});
	} else if(req.get('x-amz-sns-message-type') == 'SubscriptionConfirmation') {
		var subscribeURL = req.body.SubscribeURL;
		console.log(subscribeURL);
		console.log(req.body);
		http.get(subscribeURL, function(res) {
			console.log('Subscription Confirmed!');
			res.on('data', function(chunk) {
				console.log(chunk);
			});
		}).on('error', function(e) {
			console.log(e);
		});
	} else {
		console.log('Illegal Notification Received');
	}
	res.send('received');
});

module.exports = router;
