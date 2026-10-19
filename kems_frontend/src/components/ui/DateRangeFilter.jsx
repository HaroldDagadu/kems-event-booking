import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Card, CardContent } from './Card';
import { Calendar, Filter, X } from 'lucide-react';

const DateRangeFilter = ({ 
  onFilterChange, 
  initialFilters = {}, 
  showPresets = true,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    period: initialFilters.period || 'all_time',
    start_date: initialFilters.start_date || '',
    end_date: initialFilters.end_date || ''
  });

  const presetOptions = [
    { label: 'All Time', value: 'all_time' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'This Year', value: 'this_year' },
    { label: 'Custom Range', value: 'custom' }
  ];

  const handlePresetChange = (preset) => {
    const newFilters = { ...filters, period: preset };
    
    // Clear custom dates when switching to preset
    if (preset !== 'custom') {
      newFilters.start_date = '';
      newFilters.end_date = '';
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
    
    // Close dropdown for non-custom presets
    if (preset !== 'custom') {
      setIsOpen(false);
    }
  };

  const handleDateChange = (field, value) => {
    const newFilters = { ...filters, [field]: value, period: 'custom' };
    setFilters(newFilters);
  };

  const handleApplyCustom = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    const clearedFilters = {
      period: 'all_time',
      start_date: '',
      end_date: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setIsOpen(false);
  };

  const getActiveFilterText = () => {
    if (filters.period === 'custom' && filters.start_date && filters.end_date) {
      return `${filters.start_date} to ${filters.end_date}`;
    }
    const preset = presetOptions.find(p => p.value === filters.period);
    return preset ? preset.label : 'All Time';
  };

  const hasActiveFilters = filters.period !== 'all_time' || filters.start_date || filters.end_date;

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${hasActiveFilters ? 'border-green-500 text-green-700' : ''}`}
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">Filter: {getActiveFilterText()}</span>
        <span className="sm:hidden">Filter</span>
        <Filter className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <Card className="absolute top-full mt-2 right-0 z-50 w-80 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-800">Date Range Filter</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {showPresets && (
                <div className="space-y-2 mb-4">
                  <label className="text-sm font-medium text-gray-700">Quick Filters</label>
                  <div className="grid grid-cols-2 gap-2">
                    {presetOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.period === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetChange(option.value)}
                        className="text-xs justify-start"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {filters.period === 'custom' && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Custom Date Range
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                        <Input
                          type="date"
                          value={filters.start_date}
                          onChange={(e) => handleDateChange('start_date', e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                        <Input
                          type="date"
                          value={filters.end_date}
                          onChange={(e) => handleDateChange('end_date', e.target.value)}
                          className="w-full text-sm"
                          min={filters.start_date}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleApplyCustom}
                      disabled={!filters.start_date || !filters.end_date}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      Apply Filter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      className="text-sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {filters.period !== 'custom' && hasActiveFilters && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="w-full text-sm"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DateRangeFilter;