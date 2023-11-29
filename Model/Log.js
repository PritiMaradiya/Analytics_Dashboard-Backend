const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['success', 'failure']
    },
    errorMessage: {
        type: String,
        default: ''
    },
    requestDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    responseDetails: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
