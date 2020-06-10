const { Schema, model } = require('mongoose');
const getMoney = (num) => {
  return (num/100).toFixed(2)
}

const setMoney = (num) => {
  return num * 100
}

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    creditCard: {
      type: String
    },
    money: {
      type: Number,
      default: 0,
      get: getMoney,
      set: setMoney
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
