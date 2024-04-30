var mongoose = require('mongoose');
var BusSchema = mongoose.Schema(
    {
        plate: {
            type: String,
            required: [true, 'Enter plate'],
            unique: [true, 'Car is existed']
        },
        picture: {
            type: String,
            required: true
        },
        seats: {
            type: Number,
            required: [true, 'Enter seat'],
            min: [1, 'Enter the bus seats'],
            max: [50, 'Limited 50 seats, got {VALUE}']
        },
    }
);

var BusModel = mongoose.model("bus", BusSchema, "bus");
module.exports = BusModel;