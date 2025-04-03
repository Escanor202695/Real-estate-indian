
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';
import { addRecentSearch } from '@/services/userService';
import { toast } from 'sonner';

const SearchBar = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [locationQuery, setLocationQuery] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (location.pathname === '/properties') {
      const params = new URLSearchParams(location.search);
      const locationParam = params.get('location');
      const typeParam = params.get('type');
      const statusParam = params.get('status');
      
      if (locationParam) setLocationQuery(locationParam);
      if (typeParam) setPropertyType(typeParam);
      if (statusParam) setStatus(statusParam);
    } 
    else {
      const savedLocation = localStorage.getItem('searchLocation');
      const savedType = localStorage.getItem('searchPropertyType');
      const savedStatus = localStorage.getItem('searchStatus');
      
      if (savedLocation) setLocationQuery(savedLocation);
      if (savedType) setPropertyType(savedType);
      if (savedStatus) setStatus(savedStatus);
    }
  }, [location.pathname, location.search]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    localStorage.setItem('searchLocation', locationQuery);
    localStorage.setItem('searchPropertyType', propertyType);
    localStorage.setItem('searchStatus', status);
    
    const params = new URLSearchParams();
    
    if (locationQuery) params.append('location', locationQuery);
    if (propertyType !== 'all') params.append('type', propertyType);
    if (status !== 'all') params.append('status', status);
    
    // Track the search in our system
    if (locationQuery || propertyType !== 'all' || status !== 'all') {
      try {
        // Add to recent searches for logged-in users
        const searchData = {
          query: locationQuery || 'All Properties',
          params: {
            location: locationQuery || undefined,
            type: propertyType !== 'all' ? propertyType : undefined,
            status: status !== 'all' ? status : undefined
          },
          timestamp: new Date().toISOString()
        };
        
        // Call API to save recent search
        await addRecentSearch(searchData)
          .catch(err => console.error('Error saving recent search:', err));
      } catch (error) {
        console.error('Error tracking search:', error);
      }
    }
    
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <Input
            id="location"
            type="text"
            placeholder="City, Locality or Project"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="col-span-1">
          <label htmlFor="property-type" className="block text-sm font-medium text-gray-700 mb-1">
            Property Type
          </label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger id="property-type" className="bg-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="plot">Plot</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="pg">PG/Co-living</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-1">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            For
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status" className="bg-white">
              <SelectValue placeholder="Buy or Rent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Buy or Rent</SelectItem>
              <SelectItem value="sale">Buy</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-1 md:col-span-4 mt-2">
          <Button type="submit" className="w-full bg-clickprop-blue hover:bg-clickprop-blue-dark">
            <Search className="h-4 w-4 mr-2" />
            Search Properties
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
