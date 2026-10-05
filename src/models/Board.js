const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título del tablero es obligatorio'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual para poblar columnas sin anidar arrays gigantes en MongoDB
boardSchema.virtual('columns', {
  ref: 'Column',
  localField: '_id',
  foreignField: 'boardId'
});

// Hook de borrado en cascada a nivel de documento
boardSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const Column = mongoose.model('Column');
  const Ticket = mongoose.model('Ticket');

  // Eliminar todos los tickets asociados a este tablero
  await Ticket.deleteMany({ boardId: this._id });
  // Eliminar todas las columnas asociadas a este tablero
  await Column.deleteMany({ boardId: this._id });

  if (typeof next === 'function') next();
});

// Hook de borrado en cascada para findOneAndDelete / findByIdAndDelete
boardSchema.pre('findOneAndDelete', async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) {
    const Column = mongoose.model('Column');
    const Ticket = mongoose.model('Ticket');
    await Ticket.deleteMany({ boardId: doc._id });
    await Column.deleteMany({ boardId: doc._id });
  }
  if (typeof next === 'function') next();
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
