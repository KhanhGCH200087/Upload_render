var mongoose = require('mongoose');
var DriverSchema = mongoose.Schema(
    {
        name:{
            type: String,
            required: [true, 'Enter driver name'],
            minlength: [2, 'Min: 2 characters'],
            maxlength: [30, 'Max: 30 characters']
        },
        gender:{
            type: String,
            required: [true, 'Pls choose gender'],
            enum:{
                    values: ['Male', 'Female'],
                    message: '{VALUE} is not supported'
                }
        },
        contact: {
            type: Number,
            required: [true, 'Enter contact']
        },
        address: {
            type: String,
            required: [true, 'Enter your address']
        },
        picture: {
            type: String
        },
        account: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'account'
        }
    }
);

var DriverModel = mongoose.model("driver", DriverSchema, "driver");
module.exports = DriverModel;