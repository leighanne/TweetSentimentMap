var Twitter = require('twitter');
var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;

var dbserver = 'localhost';
var dbport = 27017;
var db;

var crawler = function(io) {
	// init database
	var dbClient = new MongoClient(new Server(dbserver, dbport));
	dbClient.open(function(err, client) {
		if(err) {
			console.log(err);
		} else {
			db = client.db('TweetMap');
			if(!db.collection('tweets')) {
				db.createCollection('tweets', function(err, col) {
					if(err) {
						console.log('Creating collection failed');
					} else {
						console.log('Collection \'tweets\' created');
					}
				});
			}
		}
	});

	// init twitter API
	var client = new Twitter({
		consumer_key: 's2jdpYFgULDDuWXNCOFD7LWB6',
		consumer_secret: 'vFlcuvJrLBQ40QgftwaBhzCCOkVf34OP8F1IsUrm6ze6TflL2i',
		access_token_key: '1064868938-Fxmllk5jTahy8SMCGsKYCr5sIoSeXI4WDW2c2uT',
		access_token_secret: 'JMi5ZMktviBaikakSvTMXb2k0Qd8JfYXWhWzZcEkzzJsu'
	});
	
	client.stream('statuses/sample', function(stream) {
		stream.on('data', function(tweet) {
			// only record tweets with location info
			if(tweet.coordinates && tweet.coordinates.coordinates) {
				var item = {
					text: tweet.text,
					coordinates: tweet.coordinates.coordinates,
					created_at: new Date(tweet.created_at)
				};
				// store in database
				db.collection('tweets').insert(item, function(err, result) {
					if(err) {
						console.log('Inserting doc failed');
					}
				});
				// push to clients
				io.emit('data', item);
			}
		});

		stream.on('error', function(error) {
			console.log(error);
		});
	});

	// remove old tweets, run every 30mins
	setInterval(function() {
		// remove tweets 30mins before
		var params = {
			created_at: {$lt: new Date(Date.now() - 30*60*1000)}
		};
		db.collection('tweets').remove(params, function(err, result) {
			if(err) {
				console.log('Removing old tweets failed');
			} else {
				console.log(result + ' old tweets removed');
			}
		});
	}, 30*60*1000);
};

module.exports = crawler;