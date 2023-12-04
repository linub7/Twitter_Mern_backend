const express = require('express');
const trimRequest = require('trim-request');

const { getUser } = require('../controllers/user');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/users/:username').get(trimRequest.all, protect, getUser);

module.exports = router;
