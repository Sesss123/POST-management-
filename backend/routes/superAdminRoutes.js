const express = require('express');
const router = express.Router();
const saController = require('../controllers/superAdminController');
const { getSystemHealth } = require('../controllers/systemHealthController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes restricted to super_admin
router.use(protect);
router.use(authorize('super_admin'));

// Platform overview
router.get('/overview', saController.getStats);
router.get('/analytics', saController.getAnalytics);
router.get('/health', getSystemHealth);
router.get('/system-health', getSystemHealth);
router.get('/audit-logs', saController.getAuditLogs);
router.get('/security', saController.getSecurityMetrics);

// Shop management
router.get('/shops', saController.getShops);
router.post('/shops', saController.createShop);
router.get('/shops/:identifier', saController.getShopById);
router.put('/shops/:id', saController.updateShop);
router.patch('/shops/:id/status', saController.updateShopStatus);
router.get('/shops/:id/usage', saController.getShopUsage);
router.post('/shops/:id/create-admin', saController.createShopAdmin);

// Menu management
router.get('/shops/:id/menu', saController.getShopMenu);
router.post('/shops/:id/menu/clone', saController.cloneShopMenu);

// Subscription management
router.get('/subscriptions', saController.getShops);
router.get('/subscription-payments', saController.getPaymentHistory);
router.post('/subscriptions/:id/mark-paid', saController.recordPayment);
router.post('/subscriptions/:id/extend', saController.extendSubscription);
router.post('/subscriptions/:id/lock', saController.lockShop);
router.post('/subscriptions/:id/unlock', saController.unlockShop);
router.post('/subscriptions/:id/grace', saController.giveGrace);
router.post('/subscriptions/:id/suspend', saController.suspendShop);
router.get('/subscriptions/:id/logs', saController.getSubscriptionLogs);

// Platform Users
router.get('/users', saController.getPlatformUsers);
router.post('/users', saController.createPlatformUser);
router.patch('/users/:id/status', saController.updateUserStatus);
router.post('/users/:id/reset-password', saController.resetUserPassword);

// Backups
router.get('/backups', saController.getBackups);
router.post('/backups/run', saController.runBackup);

// Platform Settings
router.get('/platform-settings', saController.getPlatformSettings);
router.put('/platform-settings', saController.updatePlatformSettings);

// Subscription Plans (CRUD)
const planController = require('../controllers/subscriptionPlanController');
router.get('/plans', planController.getPlans);
router.post('/plans', planController.createPlan);
router.put('/plans/:id', planController.updatePlan);
router.delete('/plans/:id', planController.deletePlan);

// Broadcast Announcements
const announcementController = require('../controllers/announcementController');
router.get('/announcements', announcementController.getAnnouncements);
router.post('/announcements', announcementController.createAnnouncement);
router.delete('/announcements/:id', announcementController.deleteAnnouncement);

// Support Tickets
const ticketController = require('../controllers/supportTicketController');
router.get('/tickets', ticketController.getAllTickets);
router.put('/tickets/:id', ticketController.updateTicket);

module.exports = router;
