var mongoose = require('mongoose');
var StudentSchema = mongoose.Schema(
    {
        name:{
            type: String,
            required: [true, 'Enter name']
        },
        gender: {
            type: String,
            required: [true, 'Pls choose gender'],
            enum: {
                values: ['Male', 'Female'],
                message: '{VALUE} is not supported'
            }
        },
        picture: String,
        RFID: String,
        class: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'class'
        },
        supervisor: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'supervisor'
        },
        role: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'role'
        }
    }
);

var StudentModel = mongoose.model("student", StudentSchema, "student");
module.exports = StudentModel;