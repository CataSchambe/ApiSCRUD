const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Column = require('../models/Column');

/**
 * POST /api/boards/:boardId/columns/:columnId/tickets
 * Crea un ticket dentro de una columna y tablero específicos
 */
const createTicket = async (req, res, next) => {
  try {
    const { title, description, status, order } = req.body;
    const { boardId, columnId } = req.params;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'El campo título del ticket es obligatorio.'
      });
    }

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status ? status.trim() : 'pending',
      order: typeof order === 'number' ? order : 0,
      boardId,
      columnId
    });

    return res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boards/:boardId/columns/:columnId/tickets
 * Lista tickets de una columna específica
 */
const getTickets = async (req, res, next) => {
  try {
    const { boardId, columnId } = req.params;
    const tickets = await Ticket.find({ boardId, columnId }).sort({ order: 1, createdAt: 1 });
    return res.status(200).json(tickets);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/boards/:boardId/columns/:columnId/tickets/:ticketId
 * Mueve un ticket o actualiza su contenido (Operación Idempotente)
 */
const patchTicket = async (req, res, next) => {
  try {
    const ticket = req.ticket;
    const { title, description, status, order, targetColumnId, columnId: newColumnId } = req.body;

    // Actualización de campos de texto/estado
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          error: 'El título no puede estar vacío.'
        });
      }
      ticket.title = title.trim();
    }

    if (description !== undefined) {
      ticket.description = typeof description === 'string' ? description.trim() : '';
    }

    if (status !== undefined) {
      ticket.status = typeof status === 'string' ? status.trim() : ticket.status;
    }

    if (order !== undefined && typeof order === 'number') {
      ticket.order = order;
    }

    // Mover ticket a otra columna (targetColumnId o columnId en el body)
    const destinationColumnId = targetColumnId || newColumnId;
    if (destinationColumnId && destinationColumnId.toString() !== ticket.columnId.toString()) {
      if (!mongoose.Types.ObjectId.isValid(destinationColumnId)) {
        return res.status(400).json({
          error: 'El ID de la columna destino es inválido. Debe ser un ObjectId de 24 caracteres hexadecimales.'
        });
      }

      const destColumn = await Column.findById(destinationColumnId);
      if (!destColumn) {
        return res.status(404).json({
          error: 'La columna destino no existe.'
        });
      }

      // Validar que la nueva columna pertenezca al mismo tablero
      if (destColumn.boardId.toString() !== req.params.boardId) {
        return res.status(400).json({
          error: 'Aislamiento de rutas: La columna destino pertenece a otro tablero.'
        });
      }

      ticket.columnId = destColumn._id;
    }

    const updatedTicket = await ticket.save();
    return res.status(200).json(updatedTicket);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/boards/:boardId/columns/:columnId/tickets/:ticketId
 * Elimina un ticket específico
 */
const deleteTicket = async (req, res, next) => {
  try {
    await req.ticket.deleteOne();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getTickets,
  patchTicket,
  deleteTicket
};
