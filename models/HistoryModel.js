var mongoose = require('mongoose');
var HistorySchema = mongoose.Schema(
    {
        rfid: String,
        latitude: Number,
        longitude: Number, 
        date: String,
        time: String
    }
);

var HistoryModel = mongoose.model("history", HistorySchema, "history");
module.exports = HistoryModel;