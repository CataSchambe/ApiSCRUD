const express = require('express');
const router = express.Router({ mergeParams: true });
const ticketController = require('../controllers/ticketController');
const {
  validateBoardExists,
  validateColumnExists,
  validateTicketExists
} = require('../middlewares/validateParent');

// Todas las operaciones de tickets requieren validar que el board y la columna existan y mantengan jerarquía
router.use(validateBoardExists);
router.use(validateColumnExists);

// POST /api/boards/:boardId/columns/:columnId/tickets
router.post('/', ticketController.createTicket);

// GET /api/boards/:boardId/columns/:columnId/tickets
router.get('/', ticketController.getTickets);

// PATCH /api/boards/:boardId/columns/:columnId/tickets/:ticketId
router.patch('/:ticketId', validateTicketExists, ticketController.patchTicket);

// DELETE /api/boards/:boardId/columns/:columnId/tickets/:ticketId
router.delete('/:ticketId', validateTicketExists, ticketController.deleteTicket);

module.exports = router;
