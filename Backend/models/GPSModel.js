var mongoose = require('mongoose');
var gpsSchema = mongoose.Schema({
    device: String,
    latitude: Number,
    longitude: Number,
})

const GPSModel = mongoose.model("GPS", gpsSchema, "GPS");

module.exports =  GPSModel ;