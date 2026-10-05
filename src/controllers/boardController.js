const Board = require('../models/Board');

/**
 * POST /api/boards
 * Crea un nuevo tablero
 */
const createBoard = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'El campo título es obligatorio.'
      });
    }

    const board = await Board.create({
      title: title.trim(),
      description: description ? description.trim() : ''
    });

    return res.status(201).json(board);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boards
 * Lista todos los tableros
 */
const getBoards = async (req, res, next) => {
  try {
    const boards = await Board.find().sort({ createdAt: -1 });
    return res.status(200).json(boards);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boards/:boardId
 * Obtiene un tablero específico con sus columnas pobladas
 */
const getBoardById = async (req, res, next) => {
  try {
    // req.board fue validado en el middleware validateBoardExists
    const boardWithColumns = await Board.findById(req.params.boardId).populate({
      path: 'columns',
      options: { sort: { order: 1, createdAt: 1 } }
    });

    return res.status(200).json(boardWithColumns);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/boards/:boardId
 * Elimina un tablero aplicando borrado en cascada (columnas y tickets)
 */
const deleteBoard = async (req, res, next) => {
  try {
    // Dispara el hook pre('deleteOne') del modelo Board
    await req.board.deleteOne();
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  deleteBoard
};
