var mongoose = require('mongoose');
var TeacherSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Enter name']
        },
        contact: {
            type: Number,
            required: [true, 'Pls enter contact number'],
        },
        address: {
            type: String,
            required: [true, 'Enter address']
        },
        picture: String,
        account: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'account'
        }
    }
);

var TeacherModel = mongoose.model("teacher", TeacherSchema, "teacher");
module.exports = TeacherModel;