import { useEffect, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { useTripStore } from '@/react-app/store/tripStore';
import TripCard from '@/react-app/components/TripCard';
import CreateTripModal from '@/react-app/components/CreateTripModal';

export default function Home() {
  const { trips, loadTrips, loading } = useTripStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expenseTotals, setExpenseTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    // Calculate expense totals for each trip
    // For now, we'll use dummy data since we don't have expenses loaded
    const totals: Record<string, number> = {};
    trips.forEach(trip => {
      totals[trip.id] = 0; // Will be updated when we load expenses
    });
    setExpenseTotals(totals);
  }, [trips]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TripSplit Pro</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Split expenses effortlessly and keep track of who owes what on your trips
          </p>
        </div>

        {/* Create Trip Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Trip
          </button>
        </div>

        {/* Trips Grid */}
        {trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                totalExpenses={expenseTotals[trip.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No trips yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first trip to start tracking and splitting expenses with friends!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Trip
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
