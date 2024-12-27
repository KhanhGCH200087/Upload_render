var mongoose = require('mongoose');
var RoleSchema = mongoose.Schema(
    {
        role: String,
        description: String
    }
);

var RoleModel = mongoose.model("role", RoleSchema, "role");
module.exports = RoleModel;