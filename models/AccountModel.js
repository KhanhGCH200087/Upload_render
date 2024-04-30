var mongoose = require('mongoose');
var AccountSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Enter email'],
            unique: [true, 'Email is existed']
        },
        password: {
            type: String,
            required: [true, 'Enter password'],
        },
        role: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'role'
        }
    }
);

var AccountModel = mongoose.model("account", AccountSchema, "account");
module.exports = AccountModel;