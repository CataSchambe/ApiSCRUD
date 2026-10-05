# Kanban API - RESTful API con Desarrollo Basado en Especificaciones (SDD)

API RESTful completa para la gestión jerárquica de proyectos estilo Kanban (Tableros $\rightarrow$ Columnas $\rightarrow$ Tickets), desarrollada bajo la metodología de **Desarrollo Basado en Especificaciones (SDD)**, centralización de reglas en `AGENTS.md` y aplicación estricta de **Límites Negativos (Negative Boundaries)**.

---

## 🛠️ Stack Tecnológico Estricto

- **Runtime**: Node.js `v24.21.0`
- **Framework Web**: Express `v4.19.2`
- **ODM**: Mongoose `v8.3.0`
- **Base de Datos**: MongoDB (compatible con MongoDB Atlas y MongoDB local)
- **Testing**: Jest `v29.7.0`, Supertest `v6.3.4` y `mongodb-memory-server`

---

## 📁 Estructura del Proyecto

El código implementa el **Principio de Responsabilidad Única (SRP)** sin mezclar lógica de base de datos en las rutas:

```
kanban-api/
├── AGENTS.md                  # Fuente única de verdad: reglas, stack y límites negativos
├── thunder-collection.json    # Colección de ThunderClient lista para importar y probar
├── package.json               # Configuración de dependencias y scripts
├── .env.example               # Plantilla de variables de entorno
├── README.md                  # Documentación completa del proyecto
├── src/
│   ├── app.js                 # Configuración de Express, middlewares y rutas
│   ├── server.js              # Punto de entrada y arranque del servidor
│   ├── config/
│   │   └── db.js              # Conexión Mongoose a MongoDB
│   ├── models/
│   │   ├── Board.js           # Modelo Tablero con hooks de cascada pre('deleteOne')
│   │   ├── Column.js          # Modelo Columna (ref: Board) con hooks de cascada
│   │   └── Ticket.js          # Modelo Ticket (ref: Board, Column)
│   ├── middlewares/
│   │   ├── validateParent.js  # Verificación estricta de existencia y aislamiento de rutas
│   │   └── errorHandler.js    # Manejador centralizado de errores { error: "mensaje" }
│   ├── controllers/
│   │   ├── boardController.js
│   │   ├── columnController.js
│   │   └── ticketController.js
│   └── routes/
│       ├── index.js           # Enrutador base montado en /api
│       ├── boardRoutes.js     # /api/boards
│       ├── columnRoutes.js    # /api/boards/:boardId/columns (mergeParams: true)
│       └── ticketRoutes.js    # /api/boards/:boardId/columns/:columnId/tickets (mergeParams: true)
└── tests/
    └── kanban.test.js         # Suite completa de pruebas automatizadas
```

---

## 🔒 Límites Negativos Implementados (Negative Boundaries)

1. **NO Arrays Simples para Tickets**:
   - Para prevenir cuellos de botella de memoria y concurrencia, los tickets **no** se guardan en arrays dentro del documento de la columna. Se almacenan en su propia colección con referencias `ObjectId` e índices en `boardId` y `columnId`.
2. **NO Errores 500 Genéricos ante IDs Inexistentes**:
   - Se capturan y devuelven respuestas HTTP semánticas:
     - `400 Bad Request` si el ID no es un ObjectId válido de 24 caracteres hexadecimales.
     - `404 Not Found` si el ID tiene formato válido pero no existe en la base de datos.
3. **NO Borrados sin Cascada**:
   - Eliminar un Tablero elimina todas sus Columnas y Tickets asociados.
   - Eliminar una Columna elimina todos sus Tickets asociados.
4. **NO Rutas Planas**:
   - Todo ticket nace y se opera bajo su contexto jerárquico estricto: `/api/boards/:boardId/columns/:columnId/tickets`.
5. **Aislamiento de Rutas (Route Isolation)**:
   - Se valida que la columna pertenezca efectivamente al tablero especificado. En caso contrario, se rechaza la petición con `400 Bad Request`.
6. **Idempotencia**:
   - La actualización y movimiento de tickets mediante `PATCH` es completamente idempotente.

---

## 📡 Contrato de la API

| Método | Endpoint | Acción | Código de Éxito |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/boards` | Crea un nuevo tablero | `201 Created` |
| **GET** | `/api/boards` | Lista todos los tableros | `200 OK` |
| **GET** | `/api/boards/:boardId` | Obtiene un tablero con sus columnas pobladas | `200 OK` |
| **DELETE** | `/api/boards/:boardId` | Elimina tablero (aplica borrado en cascada) | `204 No Content` |
| **POST** | `/api/boards/:boardId/columns` | Agrega una columna a un tablero específico | `201 Created` |
| **GET** | `/api/boards/:boardId/columns` | Lista las columnas de un tablero específico | `200 OK` |
| **DELETE** | `/api/boards/:boardId/columns/:columnId` | Elimina una columna (y sus tickets) | `204 No Content` |
| **POST** | `/api/boards/:boardId/columns/:columnId/tickets` | Crea un ticket dentro de una columna específica | `201 Created` |
| **GET** | `/api/boards/:boardId/columns/:columnId/tickets` | Lista tickets de una columna específica | `200 OK` |
| **PATCH** | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Mueve un ticket o actualiza su contenido | `200 OK` |
| **DELETE** | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Elimina un ticket específico | `204 No Content` |

---

## 🚀 Puesta en Marcha

### 1. Requisitos Previos
- Node.js `v24.21.0` instalado.

### 2. Configuración del Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Configura la variable `MONGODB_URI` con tu URI de conexión de **MongoDB Atlas**:
```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxx.mongodb.net/kanban_db?retryWrites=true&w=majority
```

### 3. Iniciar el Servidor en Desarrollo
```bash
npm run dev
```

### 4. Ejecutar las Pruebas Automatizadas
La suite de pruebas utiliza una base de datos MongoDB en memoria aislada:
```bash
npm test
```

---

## ⚡ Pruebas con ThunderClient / Postman

El proyecto incluye el archivo [`thunder-collection.json`](./thunder-collection.json) con todas las solicitudes y aserciones preconfiguradas:
1. Abre VS Code con la extensión **Thunder Client** instalada.
2. Ve a la pestaña **Collections** $\rightarrow$ Menú de opciones $\rightarrow$ **Import**.
3. Selecciona el archivo `thunder-collection.json`.
4. Ejecuta la colección para verificar todos los endpoints y casos de validación.
