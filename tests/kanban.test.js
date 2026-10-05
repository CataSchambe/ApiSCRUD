const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Board = require('../src/models/Board');
const Column = require('../src/models/Column');
const Ticket = require('../src/models/Ticket');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  // Limpiar colecciones antes de cada test
  await Board.deleteMany({});
  await Column.deleteMany({});
  await Ticket.deleteMany({});
});

describe('Kanban API - Especificación y Contratos (SDD)', () => {
  // ==========================================
  // 1. CONTRATO DE TABLEROS (BOARDS)
  // ==========================================
  describe('Tableros (/api/boards)', () => {
    it('POST /api/boards debe crear un nuevo tablero con código 201 Created', async () => {
      const res = await request(app)
        .post('/api/boards')
        .send({ title: 'Tablero Sprint 1', description: 'MVP del proyecto' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe('Tablero Sprint 1');
      expect(res.body.description).toBe('MVP del proyecto');
    });

    it('POST /api/boards debe retornar 400 Bad Request si falta el título', async () => {
      const res = await request(app)
        .post('/api/boards')
        .send({ description: 'Sin título' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('GET /api/boards debe listar todos los tableros con código 200 OK', async () => {
      await Board.create({ title: 'Tablero A' });
      await Board.create({ title: 'Tablero B' });

      const res = await request(app).get('/api/boards');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('GET /api/boards/:boardId debe retornar el tablero con sus columnas pobladas (200 OK)', async () => {
      const board = await Board.create({ title: 'Tablero Principal' });
      await Column.create({ title: 'Backlog', boardId: board._id, order: 0 });
      await Column.create({ title: 'En Progreso', boardId: board._id, order: 1 });

      const res = await request(app).get(`/api/boards/${board._id}`);
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(board._id.toString());
      expect(res.body).toHaveProperty('columns');
      expect(res.body.columns.length).toBe(2);
      expect(res.body.columns[0].title).toBe('Backlog');
    });

    it('DELETE /api/boards/:boardId debe eliminar el tablero y aplicar borrado en cascada (204 No Content)', async () => {
      const board = await Board.create({ title: 'Tablero a Eliminar' });
      const col = await Column.create({ title: 'Columna', boardId: board._id });
      await Ticket.create({ title: 'Ticket 1', boardId: board._id, columnId: col._id });
      await Ticket.create({ title: 'Ticket 2', boardId: board._id, columnId: col._id });

      const res = await request(app).delete(`/api/boards/${board._id}`);
      expect(res.status).toBe(204);

      // Verificación en DB de borrado en cascada
      const boardInDb = await Board.findById(board._id);
      const colsInDb = await Column.find({ boardId: board._id });
      const ticketsInDb = await Ticket.find({ boardId: board._id });

      expect(boardInDb).toBeNull();
      expect(colsInDb.length).toBe(0);
      expect(ticketsInDb.length).toBe(0);
    });
  });

  // ==========================================
  // 2. CONTRATO DE COLUMNAS (COLUMNS)
  // ==========================================
  describe('Columnas (/api/boards/:boardId/columns)', () => {
    it('POST /api/boards/:boardId/columns debe agregar una columna al tablero (201 Created)', async () => {
      const board = await Board.create({ title: 'Tablero Kanban' });

      const res = await request(app)
        .post(`/api/boards/${board._id}/columns`)
        .send({ title: 'Por Hacer', order: 0 });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Por Hacer');
      expect(res.body.boardId).toBe(board._id.toString());
    });

    it('GET /api/boards/:boardId/columns debe listar columnas del tablero (200 OK)', async () => {
      const board = await Board.create({ title: 'Tablero Kanban' });
      await Column.create({ title: 'Col 1', boardId: board._id, order: 0 });
      await Column.create({ title: 'Col 2', boardId: board._id, order: 1 });

      const res = await request(app).get(`/api/boards/${board._id}/columns`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('DELETE /api/boards/:boardId/columns/:columnId debe eliminar la columna y sus tickets asociados (204 No Content)', async () => {
      const board = await Board.create({ title: 'Tablero' });
      const column = await Column.create({ title: 'Columna con tickets', boardId: board._id });
      const ticket = await Ticket.create({ title: 'Ticket hijo', boardId: board._id, columnId: column._id });

      const res = await request(app).delete(`/api/boards/${board._id}/columns/${column._id}`);
      expect(res.status).toBe(204);

      const colInDb = await Column.findById(column._id);
      const ticketInDb = await Ticket.findById(ticket._id);

      expect(colInDb).toBeNull();
      expect(ticketInDb).toBeNull();
    });
  });

  // ==========================================
  // 3. CONTRATO DE TICKETS (TICKETS)
  // ==========================================
  describe('Tickets (/api/boards/:boardId/columns/:columnId/tickets)', () => {
    it('POST crea un ticket dentro de una columna específica (201 Created)', async () => {
      const board = await Board.create({ title: 'Tablero' });
      const col = await Column.create({ title: 'Columna', boardId: board._id });

      const res = await request(app)
        .post(`/api/boards/${board._id}/columns/${col._id}/tickets`)
        .send({ title: 'Implementar autenticación', description: 'JWT tokens' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Implementar autenticación');
      expect(res.body.boardId).toBe(board._id.toString());
      expect(res.body.columnId).toBe(col._id.toString());
    });

    it('GET lista los tickets de una columna específica (200 OK)', async () => {
      const board = await Board.create({ title: 'Tablero' });
      const col = await Column.create({ title: 'Columna', boardId: board._id });
      await Ticket.create({ title: 'Ticket A', boardId: board._id, columnId: col._id });
      await Ticket.create({ title: 'Ticket B', boardId: board._id, columnId: col._id });

      const res = await request(app).get(`/api/boards/${board._id}/columns/${col._id}/tickets`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('PATCH mueve un ticket de columna o actualiza contenido de forma idempotente (200 OK)', async () => {
      const board = await Board.create({ title: 'Tablero' });
      const col1 = await Column.create({ title: 'Por Hacer', boardId: board._id });
      const col2 = await Column.create({ title: 'Hecho', boardId: board._id });

      const ticket = await Ticket.create({
        title: 'Documentar API',
        boardId: board._id,
        columnId: col1._id
      });

      // Primera llamada: mover a col2 y actualizar título
      const res1 = await request(app)
        .patch(`/api/boards/${board._id}/columns/${col1._id}/tickets/${ticket._id}`)
        .send({ title: 'Documentar API (Completado)', targetColumnId: col2._id.toString() });

      expect(res1.status).toBe(200);
      expect(res1.body.title).toBe('Documentar API (Completado)');
      expect(res1.body.columnId).toBe(col2._id.toString());

      // Segunda llamada (Idempotencia ante reintentos de red con los mismos datos)
      const res2 = await request(app)
        .patch(`/api/boards/${board._id}/columns/${col2._id}/tickets/${ticket._id}`)
        .send({ title: 'Documentar API (Completado)', targetColumnId: col2._id.toString() });

      expect(res2.status).toBe(200);
      expect(res2.body.columnId).toBe(col2._id.toString());

      const ticketCount = await Ticket.countDocuments({ _id: ticket._id });
      expect(ticketCount).toBe(1);
    });

    it('DELETE elimina un ticket específico (204 No Content)', async () => {
      const board = await Board.create({ title: 'Tablero' });
      const col = await Column.create({ title: 'Columna', boardId: board._id });
      const ticket = await Ticket.create({ title: 'A borrar', boardId: board._id, columnId: col._id });

      const res = await request(app).delete(
        `/api/boards/${board._id}/columns/${col._id}/tickets/${ticket._id}`
      );
      expect(res.status).toBe(204);

      const ticketInDb = await Ticket.findById(ticket._id);
      expect(ticketInDb).toBeNull();
    });
  });

  // ==========================================
  // 4. LÍMITES NEGATIVOS Y VALIDACIONES
  // ==========================================
  describe('Límites Negativos (Negative Boundaries)', () => {
    it('Parent Check: Retorna 404 si el boardId no existe al crear columna', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/boards/${fakeBoardId}/columns`)
        .send({ title: 'Columna huérfana' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Tablero no encontrado.' });
    });

    it('Parent Check: Retorna 404 si el columnId no existe al crear ticket', async () => {
      const board = await Board.create({ title: 'Tablero' });
      const fakeColumnId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/boards/${board._id}/columns/${fakeColumnId}/tickets`)
        .send({ title: 'Ticket huérfano' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Columna no encontrada.' });
    });

    it('Aislamiento de Rutas: Retorna 400 si la columna no pertenece al tablero indicado', async () => {
      const board1 = await Board.create({ title: 'Tablero 1' });
      const board2 = await Board.create({ title: 'Tablero 2' });
      const columnOfBoard2 = await Column.create({ title: 'Columna de Tablero 2', boardId: board2._id });

      // Intento de acceder a la columna de board2 bajo la ruta de board1
      const res = await request(app).get(
        `/api/boards/${board1._id}/columns/${columnOfBoard2._id}/tickets`
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/Aislamiento de rutas/);
    });

    it('Formato de ID: Retorna 400 si el boardId no es un ObjectId válido de 24 caracteres hexadecimales', async () => {
      const res = await request(app).get('/api/boards/id_invalido_123');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: 'ID de tablero inválido. Debe ser un ObjectId de 24 caracteres hexadecimales.'
      });
    });

    it('Retorna 404 para cualquier ruta desconocida en formato { error: "..." }', async () => {
      const res = await request(app).get('/api/ruta-inexistente');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
