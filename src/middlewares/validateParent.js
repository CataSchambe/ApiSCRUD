const mongoose = require('mongoose');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Ticket = require('../models/Ticket');

/**
 * Middleware para validar formato y existencia del Tablero (Board)
 */
const validateBoardExists = async (req, res, next) => {
  const { boardId } = req.params;

  if (!boardId) {
    return next();
  }

  // Validación de formato ObjectId (Límite negativo: 400 si no es de 24 caracteres hexadecimales)
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({
      error: 'ID de tablero inválido. Debe ser un ObjectId de 24 caracteres hexadecimales.'
    });
  }

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      // Límite negativo: 404 si el ID es válido pero no existe
      return res.status(404).json({
        error: 'Tablero no encontrado.'
      });
    }

    req.board = board;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para validar formato, existencia y aislamiento de ruta de la Columna (Column)
 */
const validateColumnExists = async (req, res, next) => {
  const { columnId, boardId } = req.params;

  if (!columnId) {
    return next();
  }

  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return res.status(400).json({
      error: 'ID de columna inválido. Debe ser un ObjectId de 24 caracteres hexadecimales.'
    });
  }

  try {
    const column = await Column.findById(columnId);
    if (!column) {
      return res.status(404).json({
        error: 'Columna no encontrada.'
      });
    }

    // Aislamiento de rutas: Si se accede bajo un tablero, validar que la columna le pertenezca
    if (boardId && column.boardId.toString() !== boardId) {
      return res.status(400).json({
        error: 'Aislamiento de rutas: La columna especificada no pertenece al tablero indicado.'
      });
    }

    req.column = column;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para validar formato, existencia y pertenencia del Ticket
 */
const validateTicketExists = async (req, res, next) => {
  const { ticketId, columnId, boardId } = req.params;

  if (!ticketId) {
    return next();
  }

  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    return res.status(400).json({
      error: 'ID de ticket inválido. Debe ser un ObjectId de 24 caracteres hexadecimales.'
    });
  }

  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket no encontrado.'
      });
    }

    // Aislamiento de rutas: validar pertenencia a la columna
    if (columnId && ticket.columnId.toString() !== columnId) {
      return res.status(400).json({
        error: 'Aislamiento de rutas: El ticket especificado no pertenece a la columna indicada.'
      });
    }

    // Aislamiento de rutas: validar pertenencia al tablero
    if (boardId && ticket.boardId.toString() !== boardId) {
      return res.status(400).json({
        error: 'Aislamiento de rutas: El ticket especificado no pertenece al tablero indicado.'
      });
    }

    req.ticket = ticket;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateBoardExists,
  validateColumnExists,
  validateTicketExists
};
