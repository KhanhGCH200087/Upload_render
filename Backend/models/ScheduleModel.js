var mongoose = require('mongoose');
var ScheduleSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Enter Schedule name'],
            unique: [true, 'Schedule is existed']
        },
        date: Date,
        classes: 
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'class'
            }
        
    }
);

var ScheduleModel = mongoose.model("schedule", ScheduleSchema, "schedule");
module.exports = ScheduleModel;