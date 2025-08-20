import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Users, Receipt, DollarSign, FileText, BarChart3, Plus, Edit, Trash2 } from 'lucide-react';
import { useTripStore } from '@/react-app/store/tripStore';
import ExpenseModal from '@/react-app/components/ExpenseModal';
import { Expense } from '@/shared/types';

export default function TripDashboard() {
  const { id } = useParams();
  const { currentTrip, setCurrentTrip, trips, expenses, loadExpenses, calculateBalances, calculateSettlements, deleteExpense } = useTripStore();
  const [activeTab, setActiveTab] = useState<'expenses' | 'members' | 'balances' | 'settle' | 'insights'>('expenses');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  useEffect(() => {
    if (id) {
      const trip = trips.find(t => t.id === id);
      if (trip) {
        setCurrentTrip(trip);
        loadExpenses(id);
      }
    }
  }, [id, trips, setCurrentTrip, loadExpenses]);

  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateISO: string) => {
    return new Date(dateISO).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const tripExpenses = expenses.filter(e => e.tripId === currentTrip.id);
  const totalExpenses = tripExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const balances = id ? calculateBalances(id) : [];
  const settlements = id ? calculateSettlements(id) : [];

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(expenseId);
    }
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(undefined);
  };

  const formatCurrency = (amount: number) => {
    return `${currentTrip.currency} ${amount.toFixed(2)}`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Travel': '🚗',
      'Stay': '🏨',
      'Food': '🍽️',
      'Shopping': '🛍️',
      'Activity': '🎯',
      'Other': '📝',
    };
    return icons[category] || '📝';
  };

  const tabs = [
    { id: 'expenses' as const, label: 'Expenses', icon: Receipt },
    { id: 'members' as const, label: 'Members', icon: Users },
    { id: 'balances' as const, label: 'Balances', icon: DollarSign },
    { id: 'settle' as const, label: 'Settle', icon: FileText },
    { id: 'insights' as const, label: 'Insights', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Trips
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentTrip.name}
              </h1>
              <p className="text-gray-600 mb-4 md:mb-0">
                {formatDate(currentTrip.startDateISO)} - {formatDate(currentTrip.endDateISO)}
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentTrip.currency} {totalExpenses.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentTrip.members.length}
                </div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'expenses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Expenses</h3>
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </button>
                </div>

                {tripExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No expenses yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start by adding your first expense to this trip
                    </p>
                    <button
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add Expense
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tripExpenses.map((expense) => {
                      const payer = currentTrip.members.find(m => m.id === expense.payerId);
                      return (
                        <div key={expense.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{getCategoryIcon(expense.category)}</div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {expense.description || expense.category}
                              </div>
                              <div className="text-sm text-gray-600">
                                Paid by {payer?.name} • {new Date(expense.dateISO).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-lg font-semibold text-gray-900 mr-4">
                              {formatCurrency(expense.amount)}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Trip Members</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Add Member
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {currentTrip.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          {member.phone && (
                            <div className="text-sm text-gray-600">{member.phone}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Weight: {member.weight || 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'balances' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Member Balances</h3>
                
                {balances.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No expenses to balance
                    </h3>
                    <p className="text-gray-600">
                      Add some expenses first to see who owes what
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {balances.map((balance) => (
                      <div key={balance.memberId} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                              {balance.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{balance.name}</div>
                              <div className="text-sm text-gray-600">
                                Paid: {formatCurrency(balance.paid)} • Owes: {formatCurrency(balance.owes)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${
                              balance.net > 0 ? 'text-green-600' : balance.net < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {balance.net > 0 ? '+' : ''}{formatCurrency(balance.net)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {balance.net > 0 ? 'Should receive' : balance.net < 0 ? 'Should pay' : 'Even'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settle' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Settlement Plan</h3>
                
                {settlements.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {tripExpenses.length === 0 ? 'No settlements needed' : 'Everyone is settled up!'}
                    </h3>
                    <p className="text-gray-600">
                      {tripExpenses.length === 0
                        ? 'When expenses are added, we\'ll show the optimal way to settle up'
                        : 'All balances are even - no money needs to change hands.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <p className="text-blue-800 text-sm">
                        💡 This is the minimum number of transactions needed to settle all balances.
                      </p>
                    </div>
                    
                    {settlements.map((settlement, index) => {
                      const fromMember = currentTrip.members.find(m => m.id === settlement.fromId);
                      const toMember = currentTrip.members.find(m => m.id === settlement.toId);
                      
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold mr-3">
                              {fromMember?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-2xl mx-3">→</div>
                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold mr-3">
                              {toMember?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {fromMember?.name} pays {toMember?.name}
                              </div>
                              <div className="text-sm text-gray-600">Settlement #{index + 1}</div>
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(settlement.amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No data to analyze
                </h3>
                <p className="text-gray-600">
                  Add expenses to see spending insights and charts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {currentTrip && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={handleCloseExpenseModal}
          tripId={currentTrip.id}
          expense={editingExpense}
        />
      )}
    </div>
  );
}
