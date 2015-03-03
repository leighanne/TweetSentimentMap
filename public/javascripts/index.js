(function() {
	// load map
	var heatmap;
	var heatmapData = new google.maps.MVCArray();
	function init_map() {
		var mapOptions = {
			center: {lat: 37.6, lng: -95.665},
        	zoom: 5
		};
		var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: heatmapData,
			//radius: 25
		});
		heatmap.setMap(map);
	}
	google.maps.event.addDomListener(window, 'load', init_map);

	$(document).ready(function() {
		// fetch data in database
		$.get('/tweets', function(data) {
			data.forEach(function(d) {
				heatmapData.push(new google.maps.LatLng(d.coordinates[1], d.coordinates[0]));
			});
		});
	});
})();