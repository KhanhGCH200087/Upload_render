var mongoose = require('mongoose');
var ClassSchema = mongoose.Schema(
    {
        name:{
            type: String,
            required: [true, 'Enter class name'],
            unique: [true, 'Class name is existed']
        },
        teacher: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'teacher'
        }
    }
);

var ClassModel = mongoose.model("class", ClassSchema, "class");
module.exports = ClassModel;