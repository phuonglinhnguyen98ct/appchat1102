const router = require('express').Router();
const homeRoute = require('./homeRoute');
const chatRoute = require('./chatRoute');
const profileRoute = require('./profileRoute');
const { ensureAuthenticated } = require('../config/authenticated');

router.use('/', homeRoute);
router.use('/chat', ensureAuthenticated, chatRoute);
router.use('/profile', ensureAuthenticated, profileRoute);

module.exports = router;