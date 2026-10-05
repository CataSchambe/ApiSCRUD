const express = require('express');
const router = express.Router({ mergeParams: true });
const columnController = require('../controllers/columnController');
const ticketRoutes = require('./ticketRoutes');
const {
  validateBoardExists,
  validateColumnExists
} = require('../middlewares/validateParent');

// Todas las rutas de columnas requieren validar que el board padre exista
router.use(validateBoardExists);

// POST /api/boards/:boardId/columns
router.post('/', columnController.createColumn);

// GET /api/boards/:boardId/columns
router.get('/', columnController.getColumns);

// DELETE /api/boards/:boardId/columns/:columnId
router.delete('/:columnId', validateColumnExists, columnController.deleteColumn);

// Anidamiento a nivel nieto: /api/boards/:boardId/columns/:columnId/tickets
router.use('/:columnId/tickets', ticketRoutes);

module.exports = router;
