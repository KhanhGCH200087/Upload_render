var mongoose = require('mongoose');
var JourneySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Enter name'],
            unique: [true, 'Journey is existed']
        },
        bus: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'bus'
        },
        driver: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'driver'
        },
        schedule: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'schedule'
        }, 
        gps: { //lấy tín hiệu GPS
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'GPS'
        },
        rfid: { //lấy RFID
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'RFID'
        }
    }
);

var JourneyModel = mongoose.model("journey", JourneySchema, "journey");
module.exports = JourneyModel;