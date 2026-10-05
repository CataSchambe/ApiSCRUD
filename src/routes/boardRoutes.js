const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');
const columnRoutes = require('./columnRoutes');
const { validateBoardExists } = require('../middlewares/validateParent');

// POST /api/boards
router.post('/', boardController.createBoard);

// GET /api/boards
router.get('/', boardController.getBoards);

// GET /api/boards/:boardId
router.get('/:boardId', validateBoardExists, boardController.getBoardById);

// DELETE /api/boards/:boardId
router.delete('/:boardId', validateBoardExists, boardController.deleteBoard);

// Anidamiento a nivel hijo: /api/boards/:boardId/columns
router.use('/:boardId/columns', columnRoutes);

module.exports = router;
