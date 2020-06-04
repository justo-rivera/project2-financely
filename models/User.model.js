const { Schema, model } = require('mongoose');
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    creditCard: {
      type: String
    },
    experience: {
      type: String,
      required: true,
      enum: ['Zero experience', 'Some experience', 'Professional', 'Broker']
    },
    favorites: {
      type: [String],
    }
  },
  {
    timestamps: true
  }
)

 module.exports = model('User', userSchema);
