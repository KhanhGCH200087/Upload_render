var mongoose = require('mongoose');
var SupervisorSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Enter name']
        },
        contact: {
            type: Number,
            required: [true, 'Enter number']
        },
        address: {
            type: String,
            required: [true, 'Enter address']
        },
        picture: String,
        account: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'account'
        },
        latitude: Number,
        longitude: Number
    }
);

var SupervisorModel = mongoose.model("supervisor", SupervisorSchema, "supervisor");
module.exports = SupervisorModel;