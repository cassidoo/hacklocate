var canvas;
var points = {};
var MM;
var map;
var bingMapsURL = 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0';

var myRootRef = new Firebase('https://hacklocate.firebaseio.com/');
//myRootRef.set('null');

var dataRef = new Firebase('https://hacklocate.firebaseio.com/');

function addEvent()
{
    var title = document.getElementById('title');
    var lat = document.getElementById('lat');
    var longt = document.getElementById('longt');
    var website = document.getElementById('website');

    var loc = new Microsoft.Maps.Location(lat.value, longt.value);
    //47.592, -122.332);
    var pin = new Microsoft.Maps.Pushpin(loc);

    dataRef.push(
    {
        title : title.value,
        website : website.value,
        longitude : longt.value,
        latitude : lat.value
    });
    loadCanvas();
}

$(function()
{
    addMessage("Loading map...");

    $.ajax(
    {
        url : bingMapsURL,
        dataType : 'jsonp',
        jsonp : 'onscriptload',
        success : function(data)
        {

            MM = Microsoft.Maps;

            map = new MM.Map($('#mapDiv')[0],
            {
                credentials : "Aqag3mIJV-Ip55DE8WoGmI9VEoOh5IqdQCYqvqhv_DpmraYl0VTvvO9f7zC7EzuV",
                showCopyright : false,
                showDashboard : false,
                mapTypeId : Microsoft.Maps.MapTypeId.road,
                showLogo : false,
                showMapTypeSelector : false,
                showScalebar : false,
                center : new Microsoft.Maps.Location(40.592, -100.332),
                zoom : 4
            });

            addMessage("Loading Points...");

            var dataRef = new Firebase('https://hacklocate.firebaseio.com/');
            var i = 0;
            dataRef.on('value', function(snapshot)
            {
                snapshot.forEach(function(childSnapshot)
                {
                    points[i] =
                    {
                        lat : childSnapshot.val().latitude,
                        lon : childSnapshot.val().longitude
                    };

                    loadCanvas();
                });
            });

        }
    });
});

function loadCanvas()
{
    canvas = document.createElement('canvas');
    canvas.id = 'pointscanvas'
    canvas.style.position = 'relative';
    canvas.height = map.getHeight();
    canvas.width = map.getWidth();

    var mapDiv = map.getRootElement();
    mapDiv.parentNode.lastChild.appendChild(canvas);

    Microsoft.Maps.Events.addHandler(map, 'viewchangestart', clearCanvas);
    Microsoft.Maps.Events.addHandler(map, 'viewchangeend', drawCanvas);
}

function clearCanvas()
{

    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCanvas()
{

    var date1 = new Date().getTime();

    var context = canvas.getContext("2d");
    var bounds = map.getBounds();

    var maxLatitude = bounds.getNorth();
    var minLatitude = bounds.getSouth();
    var maxLongitude = bounds.getEast();
    var minLongitude = bounds.getWest();

    var imageData = context.createImageData(canvas.width, canvas.height);

    var pointsDrawn = 0;

    for(var i = 0; i < points.length; i++)
    {

        var loc = points[i];

        //discard coordinates outside the current map view
        if(loc.lat >= minLatitude && loc.lat <= maxLatitude && loc.lon >= minLongitude && loc.lon <= maxLongitude)
        {

            pointsDrawn++;
            var pixelCoordinate = map.tryLocationToPixel(new MM.Location(loc.lat, loc.lon), MM.PixelReference.control);
            var x = (0.5 + pixelCoordinate.x) | 0;
            var y = (0.5 + pixelCoordinate.y) | 0;
            setPixel(imageData, x, y, 255, 0, 0, 255);
        }
    }

    var date2 = new Date().getTime();
    addMessage(pointsDrawn + " Points Drawn", date2 - date1);
    context.putImageData(imageData, 0, 0);
}

function setPixel(imageData, x, y, r, g, b, a)
{

    //find the pixel index based on it's coordinates
    index = (x + y * imageData.width) * 4;

    imageData.data[index + 0] = r;
    imageData.data[index + 1] = g;
    imageData.data[index + 2] = b;
    imageData.data[index + 3] = a;
}

function addMessage(message, milliseconds)
{

    if(milliseconds === undefined)
    {
    }
    else
    {
        message = message + ' [' + milliseconds.toString() + ' ms]';
    }

    $("#lblStatus").append('<li>' + message + '</li>');

}