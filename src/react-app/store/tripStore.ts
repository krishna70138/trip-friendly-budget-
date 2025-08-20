import { create } from 'zustand';
import { Trip, Expense, Member, Settlement, MemberBalance } from '@/shared/types';
import { v4 as uuidv4 } from 'uuid';
import localforage from 'localforage';

interface TripStore {
  trips: Trip[];
  currentTrip: Trip | null;
  expenses: Expense[];
  loading: boolean;
  
  // Actions
  loadTrips: () => Promise<void>;
  createTrip: (tripData: Omit<Trip, 'id' | 'createdAtISO'>) => Promise<Trip>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setCurrentTrip: (trip: Trip | null) => void;
  
  // Member actions
  addMember: (tripId: string, member: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (tripId: string, memberId: string, updates: Partial<Member>) => Promise<void>;
  removeMember: (tripId: string, memberId: string) => Promise<void>;
  
  // Expense actions
  loadExpenses: (tripId: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Calculations
  calculateBalances: (tripId: string) => MemberBalance[];
  calculateSettlements: (tripId: string) => Settlement[];
}

// Configure localforage
const tripsDB = localforage.createInstance({ name: 'tripsplit-trips' });
const expensesDB = localforage.createInstance({ name: 'tripsplit-expenses' });

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  currentTrip: null,
  expenses: [],
  loading: false,
  
  loadTrips: async () => {
    set({ loading: true });
    try {
      const trips: Trip[] = [];
      await tripsDB.iterate<Trip, void>((trip) => {
        trips.push(trip);
      });
      set({ trips: trips.sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime()) });
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  createTrip: async (tripData) => {
    const trip: Trip = {
      ...tripData,
      id: uuidv4(),
      createdAtISO: new Date().toISOString(),
    };
    
    await tripsDB.setItem(trip.id, trip);
    set({ trips: [trip, ...get().trips] });
    return trip;
  },
  
  updateTrip: async (id, updates) => {
    const currentTrips = get().trips;
    const tripIndex = currentTrips.findIndex(t => t.id === id);
    if (tripIndex === -1) return;
    
    const updatedTrip = { ...currentTrips[tripIndex], ...updates };
    await tripsDB.setItem(id, updatedTrip);
    
    const newTrips = [...currentTrips];
    newTrips[tripIndex] = updatedTrip;
    set({ trips: newTrips });
    
    if (get().currentTrip?.id === id) {
      set({ currentTrip: updatedTrip });
    }
  },
  
  deleteTrip: async (id) => {
    await tripsDB.removeItem(id);
    // Also remove all expenses for this trip
    const expenses = get().expenses.filter(e => e.tripId === id);
    for (const expense of expenses) {
      await expensesDB.removeItem(expense.id);
    }
    
    set({ 
      trips: get().trips.filter(t => t.id !== id),
      expenses: get().expenses.filter(e => e.tripId !== id)
    });
    
    if (get().currentTrip?.id === id) {
      set({ currentTrip: null });
    }
  },
  
  setCurrentTrip: (trip) => {
    set({ currentTrip: trip });
  },
  
  addMember: async (tripId, memberData) => {
    const member: Member = {
      ...memberData,
      id: uuidv4(),
    };
    
    const trip = get().trips.find(t => t.id === tripId);
    if (!trip) return;
    
    const updatedTrip = {
      ...trip,
      members: [...trip.members, member]
    };
    
    await get().updateTrip(tripId, { members: updatedTrip.members });
  },
  
  updateMember: async (tripId, memberId, updates) => {
    const trip = get().trips.find(t => t.id === tripId);
    if (!trip) return;
    
    const memberIndex = trip.members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return;
    
    const updatedMembers = [...trip.members];
    updatedMembers[memberIndex] = { ...updatedMembers[memberIndex], ...updates };
    
    await get().updateTrip(tripId, { members: updatedMembers });
  },
  
  removeMember: async (tripId, memberId) => {
    const trip = get().trips.find(t => t.id === tripId);
    if (!trip) return;
    
    const updatedMembers = trip.members.filter(m => m.id !== memberId);
    await get().updateTrip(tripId, { members: updatedMembers });
    
    // Remove expenses paid by this member
    const expensesToRemove = get().expenses.filter(e => e.tripId === tripId && e.payerId === memberId);
    for (const expense of expensesToRemove) {
      await get().deleteExpense(expense.id);
    }
  },
  
  loadExpenses: async (tripId) => {
    set({ loading: true });
    try {
      const expenses: Expense[] = [];
      await expensesDB.iterate<Expense, void>((expense) => {
        if (expense.tripId === tripId) {
          expenses.push(expense);
        }
      });
      set({ expenses: expenses.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()) });
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  addExpense: async (expenseData) => {
    const expense: Expense = {
      ...expenseData,
      id: uuidv4(),
    };
    
    await expensesDB.setItem(expense.id, expense);
    set({ expenses: [expense, ...get().expenses] });
  },
  
  updateExpense: async (id, updates) => {
    const currentExpenses = get().expenses;
    const expenseIndex = currentExpenses.findIndex(e => e.id === id);
    if (expenseIndex === -1) return;
    
    const updatedExpense = { ...currentExpenses[expenseIndex], ...updates };
    await expensesDB.setItem(id, updatedExpense);
    
    const newExpenses = [...currentExpenses];
    newExpenses[expenseIndex] = updatedExpense;
    set({ expenses: newExpenses });
  },
  
  deleteExpense: async (id) => {
    await expensesDB.removeItem(id);
    set({ expenses: get().expenses.filter(e => e.id !== id) });
  },
  
  calculateBalances: (tripId) => {
    const trip = get().trips.find(t => t.id === tripId);
    const expenses = get().expenses.filter(e => e.tripId === tripId);
    
    if (!trip || !expenses.length) return [];
    
    const balances: MemberBalance[] = trip.members.map(member => ({
      memberId: member.id,
      name: member.name,
      paid: 0,
      owes: 0,
      net: 0,
    }));
    
    // Calculate total paid by each member
    expenses.forEach(expense => {
      const balance = balances.find(b => b.memberId === expense.payerId);
      if (balance) {
        balance.paid += expense.amount;
      }
    });
    
    // Calculate total expenses and equal share
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const sharePerPerson = totalAmount / trip.members.length;
    
    // Calculate what each member owes (equal split for now)
    balances.forEach(balance => {
      balance.owes = sharePerPerson;
      balance.net = balance.paid - balance.owes;
    });
    
    return balances;
  },
  
  calculateSettlements: (tripId) => {
    const balances = get().calculateBalances(tripId);
    const trip = get().trips.find(t => t.id === tripId);
    
    if (!trip) return [];
    
    // Create debtors (owe money) and creditors (should receive money)
    const debtors = balances.filter(b => b.net < -0.01).map(b => ({
      ...b,
      amount: Math.abs(b.net)
    })).sort((a, b) => b.amount - a.amount);
    
    const creditors = balances.filter(b => b.net > 0.01).map(b => ({
      ...b,
      amount: b.net
    })).sort((a, b) => b.amount - a.amount);
    
    const settlements: Settlement[] = [];
    
    // Greedy algorithm for minimum settlements
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const settleAmount = Math.min(debtor.amount, creditor.amount);
      
      settlements.push({
        fromId: debtor.memberId,
        toId: creditor.memberId,
        amount: Math.round(settleAmount * 100) / 100,
      });
      
      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
      
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }
    
    return settlements;
  },
}));
