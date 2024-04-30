var mongoose = require('mongoose');
var historyrfidSchema = mongoose.Schema({
    device: String,
    data: String
})

const historyRFIDModel = mongoose.model("historyRFID", historyrfidSchema, "historyRFID");

module.exports = historyRFIDModel;

