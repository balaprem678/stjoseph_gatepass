const express = require('express');
const router = express.Router();
const gatePassController = require('../controllers/gatePassController');
const authMiddleware = require('../middleware/auth');

const authorize = (roles = []) => {
    return (req, res, next) => {
        console.log(`Authorize roles: ${roles}, User role: ${req.user.role}`);
        if (!roles.includes(req.user.role)) {
            console.log('Access denied for role:', req.user.role);
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

router.use(authMiddleware);

// Student/Staff
router.post('/apply', authorize(['student', 'staff']), gatePassController.apply);
router.get('/my-requests', authorize(['student', 'staff']), gatePassController.listMyRequests);
router.patch('/:id', authorize(['student', 'staff']), gatePassController.updateRequest);
router.delete('/:id', authorize(['student', 'staff']), gatePassController.deleteRequest);

// HOD/Principal/Security/Admin
router.get('/all', authorize(['hod', 'principal', 'security', 'admin']), gatePassController.listAll);
router.patch('/:id/status', authorize(['hod', 'principal']), gatePassController.updateStatus);
router.patch('/:id/mark-used', authorize(['security', 'admin']), gatePassController.markAsUsed);

module.exports = router;
