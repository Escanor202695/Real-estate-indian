
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserPreferences, deleteSavedSearch } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash, Search, Home, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const SavedSearchesTab = () => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: getUserPreferences
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      toast.success('Search removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove search');
    }
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatSearchParams = (search: any) => {
    const params = new URLSearchParams();
    
    if (search.location) params.append('location', search.location);
    if (search.propertyType && search.propertyType !== 'all') params.append('type', search.propertyType);
    if (search.status && search.status !== 'all') params.append('status', search.status);
    if (search.minPrice) params.append('minPrice', search.minPrice.toString());
    if (search.maxPrice) params.append('maxPrice', search.maxPrice.toString());
    if (search.bedrooms) params.append('bedrooms', search.bedrooms.toString());
    
    return params.toString();
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading saved searches</div>;
  }

  const savedSearches = data?.data?.savedSearches || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Searches</CardTitle>
        <CardDescription>
          Manage your saved property searches and notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {savedSearches.length === 0 ? (
          <div className="text-center py-8">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No saved searches</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't saved any property searches yet.
            </p>
            <div className="mt-6">
              <Button asChild className="bg-clickprop-blue hover:bg-clickprop-blue-dark">
                <Link to="/properties">
                  Start Searching
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search: any) => (
              <div 
                key={search._id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-clickprop-blue mr-2" />
                    <h3 className="font-medium">
                      {search.location || 'Any location'}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      asChild
                    >
                      <Link to={`/properties?${formatSearchParams(search)}`}>
                        <Search className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(search._id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {search.propertyType && search.propertyType !== 'all' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {search.propertyType}
                    </Badge>
                  )}
                  
                  {search.status && search.status !== 'all' && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {search.status === 'sale' ? 'Buy' : 'Rent'}
                    </Badge>
                  )}
                  
                  {search.bedrooms && (
                    <Badge variant="outline">
                      {search.bedrooms}+ bedrooms
                    </Badge>
                  )}
                  
                  {(search.minPrice || search.maxPrice) && (
                    <Badge variant="outline">
                      {search.minPrice ? `₹${search.minPrice}` : '₹0'} - 
                      {search.maxPrice ? `₹${search.maxPrice}` : 'Any'}
                    </Badge>
                  )}
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch id={`notify-${search._id}`} checked={search.notifyByEmail} />
                    <Label htmlFor={`notify-${search._id}`}>
                      Email notifications
                    </Label>
                  </div>
                  <span className="text-xs text-gray-500">
                    Created {new Date(search.createdAt || search.timestamp || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedSearchesTab;
