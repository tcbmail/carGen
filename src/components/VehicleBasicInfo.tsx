import React from 'react';
import LoadingSelect from './LoadingSelect';

interface VehicleBasicInfoProps {
  year: number;
  make: string;
  model: string;
  makes: string[];
  models: string[];
  isLoadingMakes: boolean;
  isLoadingModels: boolean;
  makeError?: string;
  modelError?: string;
  onYearChange: (year: number) => void;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
}

export default function VehicleBasicInfo({
  year,
  make,
  model,
  makes,
  models,
  isLoadingMakes,
  isLoadingModels,
  makeError,
  modelError,
  onYearChange,
  onMakeChange,
  onModelChange,
}: VehicleBasicInfoProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year
        </label>
        <input
          type="number"
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          min={1900}
          max={currentYear + 1}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <LoadingSelect
        label="Make"
        value={make}
        onChange={(e) => onMakeChange(e.target.value)}
        isLoading={isLoadingMakes}
        error={makeError}
        required
      >
        <option value="">Select Make</option>
        {makes.map(make => (
          <option key={make} value={make}>{make}</option>
        ))}
      </LoadingSelect>

      <LoadingSelect
        label="Model"
        value={model}
        onChange={(e) => onModelChange(e.target.value)}
        isLoading={isLoadingModels}
        error={modelError}
        required
        disabled={!make}
      >
        <option value="">Select Model</option>
        {models.map(model => (
          <option key={model} value={model}>{model}</option>
        ))}
      </LoadingSelect>
    </div>
  );
}