const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título del ticket es obligatorio'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'El boardId es obligatorio'],
      index: true
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      required: [true, 'El columnId es obligatorio'],
      index: true
    },
    status: {
      type: String,
      trim: true,
      default: 'pending'
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
