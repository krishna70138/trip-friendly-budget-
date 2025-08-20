import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, User, DollarSign, Tag } from 'lucide-react';
import { useTripStore } from '@/react-app/store/tripStore';
import { Expense } from '@/shared/types';

const expenseFormSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  category: z.enum(['Travel', 'Stay', 'Food', 'Shopping', 'Activity', 'Other']),
  payerId: z.string().min(1, 'Please select who paid'),
  date: z.string().min(1, 'Date is required'),
  splitType: z.enum(['equal', 'weights']),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  expense?: Expense;
}

export default function ExpenseModal({ isOpen, onClose, tripId, expense }: ExpenseModalProps) {
  const { currentTrip, addExpense, updateExpense } = useTripStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: expense?.amount || 0,
      description: expense?.description || '',
      category: expense?.category || 'Other',
      payerId: expense?.payerId || '',
      date: expense ? expense.dateISO.split('T')[0] : new Date().toISOString().split('T')[0],
      splitType: expense?.splitType || 'equal',
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    if (!currentTrip) return;
    
    setIsSubmitting(true);
    try {
      const expenseData = {
        ...data,
        tripId,
        dateISO: new Date(data.date).toISOString(),
        beneficiaries: undefined, // For now, all members are beneficiaries
      };

      if (expense) {
        await updateExpense(expense.id, expenseData);
      } else {
        await addExpense(expenseData);
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !currentTrip) return null;

  const categories = [
    { value: 'Travel', icon: '🚗', label: 'Travel' },
    { value: 'Stay', icon: '🏨', label: 'Accommodation' },
    { value: 'Food', icon: '🍽️', label: 'Food & Drinks' },
    { value: 'Shopping', icon: '🛍️', label: 'Shopping' },
    { value: 'Activity', icon: '🎯', label: 'Activities' },
    { value: 'Other', icon: '📝', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Amount ({currentTrip.currency})
            </label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              {...register('description')}
              type="text"
              placeholder="What was this expense for?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Tag className="h-4 w-4 inline mr-2" />
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <label
                  key={category.value}
                  className="flex items-center p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <input
                    {...register('category')}
                    type="radio"
                    value={category.value}
                    className="sr-only"
                  />
                  <span className="text-lg mr-2">{category.icon}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </label>
              ))}
            </div>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Who Paid?
            </label>
            <select
              {...register('payerId')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select member...</option>
              {currentTrip.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            {errors.payerId && (
              <p className="text-red-500 text-sm mt-1">{errors.payerId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Date
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Type
            </label>
            <select
              {...register('splitType')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="equal">Split Equally</option>
              <option value="weights">Split by Weights</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
