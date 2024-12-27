var mongoose = require('mongoose');
var rfidSchema = mongoose.Schema({
    device: String,
    data: String
})

const RFIDModel = mongoose.model("RFID", rfidSchema, "RFID");

module.exports = RFIDModel;