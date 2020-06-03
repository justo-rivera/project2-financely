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
    transactions: {
      type: [Schema.Types.ObjectId],
      ref: 'transaction'
    },
    favorites: {
      type: [Schema.Types.ObjectId],
      ref: 'favorites'
    }
  },
  {
    timestamps: true
  }
)

 module.exports = model('User', userSchema);
