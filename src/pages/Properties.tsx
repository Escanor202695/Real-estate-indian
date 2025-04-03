
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropertyList from '@/components/properties/PropertyList';
import PropertiesPagination from '@/components/properties/PropertiesPagination';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, BookmarkPlus } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getProperties } from '@/services/propertyService';
import { useQuery } from '@tanstack/react-query';
import { addSavedSearch } from '@/services/userService';

const Properties = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Load initial values from URL params first, then localStorage if not present
  const [locationQuery, setLocationQuery] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [status, setStatus] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 25000000]);
  const [bedrooms, setBedrooms] = useState("any");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [propertiesPerPage] = useState(6);
  
  // Build query params for API call
  const buildQueryParams = () => {
    const params: any = {};
    if (locationQuery) params.location = locationQuery;
    if (propertyType !== 'all') params.type = propertyType;
    if (status !== 'all') params.status = status;
    if (priceRange[0] > 0) params.minPrice = priceRange[0];
    if (priceRange[1] < 25000000) params.maxPrice = priceRange[1];
    if (bedrooms !== 'any') params.bedrooms = parseInt(bedrooms);
    params.page = currentPage;
    params.limit = propertiesPerPage;
    return params;
  };
  
  // Fetch properties using React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', locationQuery, propertyType, status, priceRange, bedrooms, currentPage],
    queryFn: () => getProperties(buildQueryParams()),
    enabled: !loading // Don't fetch if we're already loading
  });
  
  const properties = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / propertiesPerPage);
  
  // Load filters from URL params or localStorage on initial render
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const locationParam = params.get('location');
    const typeParam = params.get('type');
    const statusParam = params.get('status');
    const pageParam = params.get('page');
    
    // Set location from URL or localStorage
    if (locationParam) {
      setLocationQuery(locationParam);
    } else {
      const savedLocation = localStorage.getItem('searchLocation');
      if (savedLocation) setLocationQuery(savedLocation);
    }
    
    // Set type from URL or localStorage
    if (typeParam) {
      setPropertyType(typeParam);
    } else {
      const savedType = localStorage.getItem('searchPropertyType');
      if (savedType) setPropertyType(savedType);
    }
    
    // Set status from URL or localStorage
    if (statusParam) {
      setStatus(statusParam);
    } else {
      const savedStatus = localStorage.getItem('searchStatus');
      if (savedStatus) setStatus(savedStatus);
    }
    
    // Set page from URL
    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10));
    }
  }, [location.search]);
  
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  const applyFilters = () => {
    setLoading(true);
    
    // Save search params to localStorage
    localStorage.setItem('searchLocation', locationQuery);
    localStorage.setItem('searchPropertyType', propertyType);
    localStorage.setItem('searchStatus', status);
    
    // Reset to first page when applying new filters
    setCurrentPage(1);
    
    // Update URL
    updateUrl();
    
    setTimeout(() => {
      setLoading(false);
    }, 300);
  };

  // Update URL with current filter values and page
  const updateUrl = () => {
    const params = new URLSearchParams();
    
    if (locationQuery) params.append('location', locationQuery);
    if (propertyType !== 'all') params.append('type', propertyType);
    if (status !== 'all') params.append('status', status);
    if (currentPage > 1) params.append('page', currentPage.toString());
    
    const newUrl = `/properties?${params.toString()}`;
    navigate(newUrl, { replace: true });
  };

  // Save the current search
  const saveSearch = async () => {
    try {
      // Create search params object for the API
      const searchData = {
        location: locationQuery,
        propertyType,
        status,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 25000000 ? priceRange[1] : undefined,
        bedrooms: bedrooms !== 'any' ? parseInt(bedrooms) : undefined,
        notifyByEmail: true
      };
      
      // Call the API to save the search
      const response = await addSavedSearch(searchData);
      
      toast({
        title: "Search Saved",
        description: "Your property search has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your search. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Change page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Update URL with new page number
    const params = new URLSearchParams(location.search);
    if (pageNumber > 1) {
      params.set('page', pageNumber.toString());
    } else {
      params.delete('page');
    }
    navigate(`/properties?${params.toString()}`, { replace: true });
    window.scrollTo(0, 0);
  };
  
  // Helper function to construct the search summary
  const getSearchSummary = () => {
    let summary = '';
    
    if (propertyType && propertyType !== 'all') {
      summary += propertyType.charAt(0).toUpperCase() + propertyType.slice(1) + 's ';
    } else {
      summary += 'Properties ';
    }
    
    if (status && status !== 'all') {
      summary += `for ${status === 'sale' ? 'sale' : 'rent'} `;
    }
    
    if (locationQuery) {
      summary += `in ${locationQuery}`;
    }
    
    return summary || 'All Properties';
  };
  
  return (
    <div className="bg-white">
      <div className="bg-clickprop-blue py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white text-center">
            {locationQuery ? `Properties in ${locationQuery}` : 'Browse All Properties'}
          </h1>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="flex items-center mr-4"
              onClick={toggleFilter}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <Button
              variant="default"
              className="bg-clickprop-blue hover:bg-clickprop-blue-dark"
              onClick={() => applyFilters()}
            >
              <Search className="h-4 w-4 mr-2" />
              Search Properties
            </Button>
          </div>
          
          <div className="flex items-center">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={saveSearch}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save Search
            </Button>
            <span className="text-clickprop-text-secondary ml-4">
              {properties.length} properties
            </span>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className={`lg:w-1/4 bg-white p-6 rounded-lg shadow-sm ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            <h2 className="text-xl font-semibold mb-4 text-clickprop-text">Filters</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-clickprop-text-secondary mb-1">
                  Location
                </label>
                <Input
                  id="location"
                  type="text"
                  placeholder="City or locality"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="property-type" className="block text-sm font-medium text-clickprop-text-secondary mb-1">
                  Property Type
                </label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger id="property-type">
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
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-clickprop-text-secondary mb-1">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Buy or Rent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Buy or Rent</SelectItem>
                    <SelectItem value="sale">Buy</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clickprop-text-secondary mb-3">
                  Price Range (₹)
                </label>
                <Slider
                  defaultValue={[0, 25000000]}
                  max={25000000}
                  step={500000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-clickprop-text-secondary">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-clickprop-text-secondary mb-1">
                  Bedrooms
                </label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger id="bedrooms">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                className="w-full bg-clickprop-blue hover:bg-clickprop-blue-dark"
                onClick={() => applyFilters()}
              >
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
          
          <div className="lg:w-3/4">
            {/* Search summary info box */}
            {locationQuery && (
              <div className="p-4 bg-clickprop-bg-gray rounded-lg flex items-center mb-6">
                <Search className="h-5 w-5 text-clickprop-blue mr-2" />
                <span className="text-clickprop-text-secondary">
                  Showing <span className="font-medium text-clickprop-text">{getSearchSummary()}</span>
                </span>
                {totalCount > 0 && (
                  <span className="ml-1 text-clickprop-text-secondary">
                    - {totalCount} {totalCount === 1 ? 'property' : 'properties'} found
                  </span>
                )}
              </div>
            )}
            
            <PropertyList properties={properties} loading={isLoading || loading} />
            
            {totalPages > 1 && (
              <PropertiesPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;
