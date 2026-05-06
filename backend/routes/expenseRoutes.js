const express = require('express');
const router = express.Router();
const { 
    getExpenses, 
    createExpense, 
    getExpense, 
    updateExpense, 
    cancelExpense 
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getExpenses)
    .post(createExpense);

router.route('/:identifier')
    .get(getExpense)
    .put(authorize('admin'), updateExpense);

router.patch('/:id/cancel', authorize('admin'), cancelExpense);

module.exports = router;
