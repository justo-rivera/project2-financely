const { Schema, model } = require('mongoose');

favoriteSchema = new Schema({
    symbol: String
  }
)

module.exports = model('Favorite', favoriteSchema)