const { Schema, model } = require('mongoose');

const sessionSchema = new Schema({
    session: String,
    created: Date
})

module.exports = model('Session', sessionSchema)