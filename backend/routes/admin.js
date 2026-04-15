const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }
        next();
    };
};

router.use(authMiddleware);
router.use(authorize(['admin']));

router.post('/create-profile', adminController.createProfile);
router.patch('/update-profile/:mongoId', adminController.updateProfile);
router.get('/users', adminController.listUsers);
router.get('/smtp', adminController.getSMTPConfig);
router.post('/smtp', adminController.updateSMTP);
router.get('/sms', adminController.getSMSConfig);
router.post('/sms', adminController.updateSMS);
router.get('/stats', adminController.getStats);

module.exports = router;
