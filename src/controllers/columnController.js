const Column = require('../models/Column');

/**
 * POST /api/boards/:boardId/columns
 * Agrega una columna a un tablero específico
 */
const createColumn = async (req, res, next) => {
  try {
    const { title, order } = req.body;
    const { boardId } = req.params;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'El campo título de la columna es obligatorio.'
      });
    }

    const column = await Column.create({
      title: title.trim(),
      boardId,
      order: typeof order === 'number' ? order : 0
    });

    return res.status(201).json(column);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boards/:boardId/columns
 * Lista las columnas de un tablero específico
 */
const getColumns = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const columns = await Column.find({ boardId }).sort({ order: 1, createdAt: 1 });
    return res.status(200).json(columns);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/boards/:boardId/columns/:columnId
 * Elimina una columna y sus tickets asociados (cascada)
 */
const deleteColumn = async (req, res, next) => {
  try {
    // Dispara el hook pre('deleteOne') del modelo Column
    await req.column.deleteOne();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createColumn,
  getColumns,
  deleteColumn
};
