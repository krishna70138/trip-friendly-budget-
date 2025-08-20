import { Trip } from '@/shared/types';
import { Calendar, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router';

interface TripCardProps {
  trip: Trip;
  totalExpenses: number;
}

export default function TripCard({ trip, totalExpenses }: TripCardProps) {
  const formatDate = (dateISO: string) => {
    return new Date(dateISO).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysLeft = () => {
    const today = new Date();
    const startDate = new Date(trip.startDateISO);
    const endDate = new Date(trip.endDateISO);
    
    if (today < startDate) {
      const days = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${days} days to go`, color: 'text-blue-600' };
    } else if (today <= endDate) {
      const days = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${days} days left`, color: 'text-green-600' };
    } else {
      return { text: 'Completed', color: 'text-gray-500' };
    }
  };

  const status = getDaysLeft();

  return (
    <Link to={`/trip/${trip.id}`} className="block">
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 truncate pr-4">{trip.name}</h3>
          <span className={`text-sm font-medium px-3 py-1 rounded-full bg-gray-100 ${status.color}`}>
            {status.text}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {formatDate(trip.startDateISO)} - {formatDate(trip.endDateISO)}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm">{trip.members.length} members</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {trip.currency} {totalExpenses.toFixed(2)} total
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex -space-x-2">
          {trip.members.slice(0, 4).map((member, index) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
              style={{ zIndex: trip.members.length - index }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {trip.members.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
              +{trip.members.length - 4}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
