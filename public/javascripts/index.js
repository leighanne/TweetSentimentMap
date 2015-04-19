(function() {
	var map;
	var heatmap;
	var heatmapData = new google.maps.MVCArray();
	var allData = [];

	var filter = false;
	var keywords = [];

	var markerClusterer;

	var infoWindow = new google.maps.InfoWindow();

	var sentimentColors = {
		'positive': 'ff7f0e',
		'negative': '1f77b4',
	};

	var posNum = 0;
	var negNum = 0;

	// load map
	function init_map() {
		var mapOptions = {
			center: {lat: 37.6, lng: -95.665},
        	zoom: 5
		};
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		// heat map
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: heatmapData,
			radius: 25
		});
		heatmap.setMap(map);
		// marker cluster
		markerClusterer = new MarkerClusterer(map, [], {ignoreHidden: true});
	}
	google.maps.event.addDomListener(window, 'load', init_map);

	function buildData() {
		var data = {
			mapData: [],
			markers: []
		};
		if(filter) {
			allData.forEach(function(d) {
				d.marker = null;
				var show = true;
				keywords.forEach(function(k) {
					if(d.text.toLowerCase().indexOf(k.toLowerCase()) < 0) {
						show = false;
					}
				});
				if(show) {
					var loc = new google.maps.LatLng(d.coordinates[1], d.coordinates[0]);
					data.mapData.push(loc);
					var marker = new google.maps.Marker({ position: loc});
					d.marker = marker;
					addPopover(marker, d.text);
					setMarkerColor(marker, d.sentiment);
					data.markers.push(marker);
				}
			});
		} else {
			allData.forEach(function(d) {
				var loc = new google.maps.LatLng(d.coordinates[1], d.coordinates[0]);
				data.mapData.push(loc);
				var marker = new google.maps.Marker({ position: loc});
				d.marker = marker;
				addPopover(marker, d.text);
				setMarkerColor(marker, d.sentiment);
				data.markers.push(marker);
			});
		}
		return data;
	}

	function addPopover(marker, data) {
		google.maps.event.addListener(marker, 'mouseover', function() {
			infoWindow.setContent(data);
			infoWindow.open(map, marker);
		});
		google.maps.event.addListener(marker, 'mouseout', function() {
			infoWindow.setContent('');
			infoWindow.close();
		});
	}

	function setMarkerColor(marker, sentiment) {
		if(!sentiment || !marker) {
			return;
		}
		var polar = sentiment >= 0 ? 'positive' : 'negative';
		var color = sentimentColors[polar];
		var icon = "https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + color;
		marker.setIcon(icon);
		polar == 'positive' ? posNum++ : negNum++;
		refreshNum();
	}

	function refreshNum() {
		$('#pos-num').text(posNum);
		$('#neg-num').text(negNum);
	}

	$(document).ready(function() {
		// fetch data in database
		$.get('/tweets', function(data) {
			data.forEach(function(d) {
				allData.push(d);
				var loc = new google.maps.LatLng(d.coordinates[1], d.coordinates[0]);
				heatmapData.push(loc);
				//markers.push(new google.maps.Marker({ position: loc}));
				var marker = new google.maps.Marker({ position: loc});
				d.marker = marker;
				addPopover(marker, d.text);
				setMarkerColor(marker, d.sentiment);
				markerClusterer.addMarker(marker);
			});
		});

		// websocket...for real time data
		var socket = io();
		//var socket = io.connect('ws://tweetmap.elasticbeanstalk.com/');
		socket.on('data', function(d) {
			allData.push(d);
			d.marker = null;
			// if there is a filter
			if(filter) {
				var show = false;
				keywords.forEach(function(k) {
					if(d.text.toLowerCase().indexOf(k.toLowerCase()) >= 0) {
						show = true;
					}
				});
				if(!show)
					return;
			}
			var loc = new google.maps.LatLng(d.coordinates[1], d.coordinates[0]);
			heatmapData.push(loc);

			//markers.push(new google.maps.Marker({ position: loc}));
			if($('#markerclusterCbox').is(':checked')) {
				var marker = new google.maps.Marker({ position: loc});
				d.marker = marker;
				addPopover(marker, d.text);
				markerClusterer.addMarker(marker);
			} else {
				// flash a marker
				var marker = new google.maps.Marker({
					position: loc,
					map: map
				});
				setTimeout(function() {
					marker.setMap(null);
				}, 1000);
			}
		});

		socket.on('sentiment', function(d) {
			var data = null;
			for(var i = 0; i < allData.length; i++) {
				if(allData[i]._id == d._id) {
					data = allData[i];
					break;
				}
			}
			if(data == null)
				return;
			data.sentiment = d.sentiment;
			setMarkerColor(data.marker, data.sentiment);
		});

		// filter
		$('#filterBtn').click(function() {
			var filterStr = $('#filterInput').val();
			var result;
			markerClusterer.clearMarkers();
			if(filterStr != '') {
				keywords = filterStr.trim().split(/\s+/g);
				filter = true;
				result = buildData(filter);
			} else {
				filter = false;
				result = buildData(filter);
			}
			if($('#heatmapCbox').is(':checked')) {
				heatmapData = new google.maps.MVCArray(result.mapData);
				heatmap.setData(heatmapData);
			}
			if($('#markerclusterCbox').is(':checked')) {
				markerClusterer = new MarkerClusterer(map, result.markers);
			}
		});

		// heatmap check
		$('#heatmapCbox').change(function() {
			if($(this).is(':checked')) {
				heatmap.setMap(map);
			} else {
				heatmap.setMap(null);
			}
		});

		// markercluster check
		$('#markerclusterCbox').change(function() {
			if($(this).is(':checked')) {
				var result = buildData();
				markerClusterer = new MarkerClusterer(map, result.markers);
			} else {
				markerClusterer.clearMarkers();
				//markerClusterer.setMap(null);
			}
		});
	});

})();