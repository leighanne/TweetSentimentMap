(function() {
	var map;
	var heatmap;
	var heatmapData = new google.maps.MVCArray();
	var allData = [];

	var filter = false;
	var keywords = [];

	// load map
	function init_map() {
		var mapOptions = {
			center: {lat: 37.6, lng: -95.665},
        	zoom: 5
		};
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: heatmapData,
			radius: 25
		});
		heatmap.setMap(map);
	}
	google.maps.event.addDomListener(window, 'load', init_map);

	$(document).ready(function() {
		// fetch data in database
		$.get('/tweets', function(data) {
			data.forEach(function(d) {
				allData.push(d);
				heatmapData.push(new google.maps.LatLng(d.coordinates[1], d.coordinates[0]));
			});
		});
		// websocket...for real time data
		var socket = io.connect('http://localhost:3000/');
		socket.on('data', function(d) {
			allData.push(d);
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
			// flash a marker
			var marker = new google.maps.Marker({
				position: loc,
				map: map
			});
			setTimeout(function() {
				marker.setMap(null);
			}, 1000);
		});
		// filter
		$('#filterBtn').click(function() {
			var filterStr = $('#filterInput').val();
			var mapData = [];
			if(filterStr != '') {
				keywords = filterStr.split();
				filter = true;
				allData.forEach(function(d) {
					var show = false;
					keywords.forEach(function(k) {
						if(d.text.toLowerCase().indexOf(k.toLowerCase()) >= 0) {
							show = true;
						}
					});
					if(show)
						mapData.push(new google.maps.LatLng(d.coordinates[1], d.coordinates[0]));
				});
			} else {
				filter = false;
				allData.forEach(function(d) {
					mapData.push(new google.maps.LatLng(d.coordinates[1], d.coordinates[0]));
				});
			}
			heatmapData = new google.maps.MVCArray(mapData);
			heatmap.setData(heatmapData);
		});
	});

})();