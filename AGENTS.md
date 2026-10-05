# Especificación de Reglas y Directrices de Arquitectura (AGENTS.md)

Este documento constituye la **fuente única de verdad** para el desarrollo, mantenimiento y evaluación de la API RESTful de Tableros, Columnas y Tickets (Kanban API) siguiendo la metodología de **Desarrollo Basado en Especificaciones (SDD)**.

---

## 1. Stack Tecnológico Estricto

* **Runtime**: Node.js `24.21.0` (especificado en `package.json -> engines`).
* **Framework Web**: Express `4.x`.
* **ODM**: Mongoose `8.x`.
* **Herramientas de entorno**: `dotenv` para configuración por variables de entorno y `cors`.
* **Base de Datos**: MongoDB (MongoDB Atlas o local/in-memory para tests).

---

## 2. Patrones de Diseño y Principio de Responsabilidad Única (SRP)

El código debe estar estrictamente modularizado en capas desacopladas:
* `src/models/`: Únicamente definición de esquemas de Mongoose, tipos de datos, referencias relacionales (`ref`) y hooks de ciclo de vida (`pre('deleteOne')`).
* `src/controllers/`: Funciones de lógica de negocio, orquestación de operaciones y emisión de respuestas HTTP.
* `src/routes/`: Declaración de endpoints HTTP y anidamiento con `express.Router({ mergeParams: true })`.
  * **Regla estricta**: Prohibido incluir lógica de base de datos (`Model.find`, etc.) dentro de los archivos de rutas.
* `src/middlewares/`:
  * `validateParent.js`: Validación de existencia jerárquica del recurso padre y aislamiento de rutas.
  * `errorHandler.js`: Manejo global y centralizado de excepciones.
* `src/config/`: Conexión y configuración de Mongoose (`db.js`).

---

## 3. Estándar Global de Respuestas y Manejo de Errores

Toda respuesta de error debe tener una estructura JSON homogénea y predecible:
```json
{
  "error": "Mensaje explicativo del error"
}
```

### Respuestas HTTP Semánticas
* **`200 OK`**: Petición de lectura o actualización exitosa.
* **`201 Created`**: Recurso creado exitosamente (Tablero, Columna o Ticket).
* **`204 No Content`**: Recurso eliminado exitosamente sin contenido en el cuerpo.
* **`400 Bad Request`**:
  * Payload inválido (ej. campo requerido faltante como `title`).
  * Formato de ID inválido (no cumple con los 24 caracteres hexadecimales de MongoDB `ObjectId`).
  * Violación de aislamiento de ruta (ej. la columna existe pero pertenece a otro tablero).
* **`404 Not Found`**: El ID tiene formato válido de 24 caracteres hexadecimales pero el recurso no existe en la base de datos (aplica para `boardId`, `columnId` y `ticketId`).
* **`500 Internal Server Error`**: Excepciones no controladas; el middleware global debe capturarlas y responder `{ error: "Error interno del servidor" }` sin exponer trazas internas.

---

## 4. Límites Negativos (Negative Boundaries)

Las siguientes prácticas están **explícitamente prohibidas**:
1. **NO anidar tickets en arrays simples dentro de las columnas**:
   * Los tickets **no** deben ser subdocumentos embebidos dentro de un array en el documento de `Column`.
   * Se deben modelar en una colección separada (`tickets`) con referencias `ObjectId` a `columnId` y `boardId`.
2. **NO retornar errores 500 genéricos por IDs inexistentes**:
   * Si `boardId`, `columnId` o `ticketId` no existen en la base de datos, el sistema debe capturar la condición y responder un `404 Not Found` con `{ error: "..." }`.
3. **NO utilizar `findByIdAndDelete` sin garantizar el borrado en cascada**:
   * Eliminar un Tablero debe eliminar todas sus Columnas y todos los Tickets asociados.
   * Eliminar una Columna debe eliminar todos sus Tickets asociados.
   * El borrado debe orquestarse mediante hooks de esquema (`pre('deleteOne')`) o lógica transaccional/controlador que garantice la integridad referencial.
4. **NO utilizar rutas planas para la creación o jerarquía**:
   * Prohibido crear tickets en rutas como `/api/tickets`. Todo ticket debe crearse en su contexto jerárquico: `/api/boards/:boardId/columns/:columnId/tickets`.
5. **NO mezclar lógica de persistencia en las rutas**.

---

## 5. Contrato de la API (Endpoints Oficiales)

| Método | Endpoint | Acción | Código Éxito |
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
| **PATCH** | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Mueve un ticket o actualiza su contenido (Idempotente) | `200 OK` |
| **DELETE** | `/api/boards/:boardId/columns/:columnId/tickets/:ticketId` | Elimina un ticket específico | `204 No Content` |

---

## 6. Idempotencia y Manejo de Concurrencia

El endpoint `PATCH /api/boards/:boardId/columns/:columnId/tickets/:ticketId` debe ser **idempotente**:
* Si un cliente reenvía la misma petición de actualización o cambio de columna dos o más veces debido a fallos de red o reintentos, el estado resultante en la base de datos debe ser exactamente el mismo.
* No deben generarse registros duplicados ni desincronizarse las referencias relacionales (`boardId` y `columnId`).
