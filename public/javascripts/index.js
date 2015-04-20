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
	}

	function refreshNum() {
		$('#pos-num').text(posNum);
		$('#neg-num').text(negNum);
	}

	function buildTrendChart() {
		var currentTrend = 0;
		var data; // data to draw the chart
		var newData; // new data to be displayed
		var n; // number of data points to show
		var duration; // time duration for updating line chart
		var now; // the latest time in the chart

		var margin = {top: 20, bottom: 20, left: 40, right: 20},
			width = 400 - margin.left - margin.right,
			height = 250 - margin.top - margin.bottom;

		var x; // x scale
		var y; // y scale
		var line; // d3 line
		var xAxis; // d3 xAxis
		var yAxis; // d3 yAxis
		var timeform = d3.time.format("%X");

		var svg; // canvas
		var xAxisSvg; // x axis svg
		var yAxisSvg; // y axis svg
		var path; // path svg
		var xLabel;
		var yLabel;

		var drawLineChart = function() {
			n = 20;
			duration = 500;
			data = d3.range(n).map(function() { return 0; });
			newData = (posNum / (posNum + negNum) - 0.5) * 2;
			now = new Date(Date.now() - duration);

			x = d3.time.scale()
				.domain([now - (n-2)*duration, now - duration])
				.range([0, width]);

			y = d3.scale.linear()
				//.domain([-1, 1])
				.range([height, 0]);

			line = d3.svg.line()
				.interpolate("basis")
				.x(function(d, i) { return x(now - (n - 1 - i) * duration); })
				.y(function(d, i) { return y(d); });

			svg = d3.select("#sentimentTrendChart").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom + 20)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			svg.append("defs").append("clipPath")
				.attr("id", "trendCurveClip")
				.append("rect")
				.attr("width", width)
				.attr("height", height);

			xAxis = d3.svg.axis().scale(x).orient("bottom");//.tickFormat(timeform);
			yAxis = d3.svg.axis().scale(y).orient("left");

			xAxisSvg = svg.append("g")
				.classed("axis", true)
				.attr("transform", "translate(0," + height/2 + ")")
				.call(xAxis);

			xLabel = xAxisSvg.append("text")
				.classed("axislabel", true)
				.attr("x", width/2)
				.attr("y", 35)
				.attr("text-anchor", "middle")
				.text("Time");

			yAxisSvg = svg.append("g")
				.classed("axis", true)
				.call(yAxis);

			yLabel = yAxisSvg.append("text")
				.classed("axislabel", true)
				.attr("x", -height/2)
				.attr("y", -30)
				.attr("transform", "rotate(-90)")
				.attr("text-anchor", "middle")
				.text("Trend");

			path = svg.append("g")
				.attr("clip-path", "url(#trendCurveClip)")
				.append("path")
				.data([data])
				.classed("line", true)

			tick();
		};

		var tick = function() {
			now = new Date();
			newData = (posNum / (posNum + negNum) - 0.5) * 2;
			data.push(newData);

			x.domain([now - (n-2)*duration, now - duration]);
			var limit = Math.abs(d3.max(data)) > Math.abs(d3.min(data)) ? Math.abs(d3.max(data)) : Math.abs(d3.min(data));
			y.domain([-limit, limit]);

			svg.select(".line")
				.attr("d", line)
				.attr("transform", null);

			xAxisSvg.transition()
				.duration(duration)
				.ease("linear")
				.call(xAxis);

			yAxisSvg.transition()
				.duration(duration)
				.ease("linear")
				.call(yAxis);
			
			path.transition()
				.duration(duration)
				.ease("linear")
				.attr("transform", "translate(" + x(now - (n-1)*duration) + ")")
				.each("end", tick);

			data.shift();
		};

		drawLineChart();
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
				if(d.sentiment) {
					d.sentiment >= 0 ? posNum++ : negNum++;
					refreshNum();
				}
				markerClusterer.addMarker(marker);
			});
		});

		// build trend chart
		buildTrendChart();

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
			if(d.sentiment) {
				d.sentiment >= 0 ? posNum++ : negNum++;
				refreshNum();
			}
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