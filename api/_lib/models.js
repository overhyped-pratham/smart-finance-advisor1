import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // uid
    username: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const budgetSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // uid
    amount: { type: Number, default: 0 },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const expenseSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // expense id
    user_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: 'Other' },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
export const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema, 'budgets');
export const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema, 'expenses');

