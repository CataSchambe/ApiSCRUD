const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título de la columna es obligatorio'],
      trim: true
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'El boardId es obligatorio'],
      index: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual para poblar tickets sin guardar arrays en el documento
columnSchema.virtual('tickets', {
  ref: 'Ticket',
  localField: '_id',
  foreignField: 'columnId'
});

// Hook de borrado en cascada a nivel de documento
columnSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const Ticket = mongoose.model('Ticket');
  await Ticket.deleteMany({ columnId: this._id });
  if (typeof next === 'function') next();
});

// Hook de borrado en cascada para findOneAndDelete / findByIdAndDelete
columnSchema.pre('findOneAndDelete', async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const Ticket = mongoose.model('Ticket');
    await Ticket.deleteMany({ columnId: doc._id });
  }
  if (typeof next === 'function') next();
});

const Column = mongoose.model('Column', columnSchema);

module.exports = Column;
