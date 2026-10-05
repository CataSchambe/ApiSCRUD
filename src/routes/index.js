const express = require('express');
const router = express.Router();
const boardRoutes = require('./boardRoutes');

router.use('/boards', boardRoutes);

module.exports = router;
