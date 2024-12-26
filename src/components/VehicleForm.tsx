import React, { useState, useEffect } from 'react';
import { Car } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  decodeVIN, 
  generateDescription, 
  getMakesForYear,
  getModelsForMakeYear,
  getCommonColors,
  type VehicleInfo 
} from '../lib/api';
import VehicleBasicInfo from './VehicleBasicInfo';

export default function VehicleForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [method, setMethod] = useState<'vin' | 'manual'>('vin');
  const [description, setDescription] = useState('');
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [makeError, setMakeError] = useState<string>();
  const [modelError, setModelError] = useState<string>();
  const [descriptionType, setDescriptionType] = useState<'full' | 'short'>('full');
  
  const { exterior: exteriorColors, interior: interiorColors } = getCommonColors();

  const [formData, setFormData] = useState({
    vin: '',
    year: new Date().getFullYear(),
    make: '',
    model: '',
    miles: 0,
    price: 0,
    engineSize: '',
    transmission: 'Automatic',
    drivetrain: '2WD',
    exteriorColor: '',
    interiorColor: '',
    interiorType: 'Cloth',
    titleStatus: 'Clean',
    condition: 'Good',
    additionalDetails: ''
  });

  useEffect(() => {
    if (method === 'manual') {
      setIsLoadingMakes(true);
      setMakeError(undefined);
      getMakesForYear(formData.year)
        .then(fetchedMakes => {
          setMakes(fetchedMakes);
        })
        .catch(error => {
          setMakeError(error.message);
          setMakes([]);
        })
        .finally(() => setIsLoadingMakes(false));
    }
  }, [formData.year, method]);

  useEffect(() => {
    if (method === 'manual' && formData.make && formData.year) {
      setIsLoadingModels(true);
      setModelError(undefined);
      getModelsForMakeYear(formData.make, formData.year)
        .then(fetchedModels => {
          setModels(fetchedModels);
        })
        .catch(error => {
          setModelError(error.message);
          setModels([]);
        })
        .finally(() => setIsLoadingModels(false));
    }
  }, [formData.make, formData.year, method]);

  const handleYearChange = (year: number) => {
    setFormData({
      ...formData,
      year,
      make: '',
      model: ''
    });
    setModels([]);
    setModelError(undefined);
  };

  const handleMakeChange = (make: string) => {
    setFormData({
      ...formData,
      make,
      model: ''
    });
    setModelError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDescription('');

    try {
      let vehicleInfo: VehicleInfo;

      if (method === 'vin') {
        vehicleInfo = await decodeVIN(formData.vin);
        vehicleInfo = {
          ...vehicleInfo,
          price: formData.price,
          exteriorColor: formData.exteriorColor,
          interiorColor: formData.interiorColor,
          interiorType: formData.interiorType,
          titleStatus: formData.titleStatus
        };
      } else {
        vehicleInfo = {
          year: formData.year,
          make: formData.make,
          model: formData.model,
          engineSize: formData.engineSize,
          transmission: formData.transmission,
          drivetrain: formData.drivetrain,
          price: formData.price,
          exteriorColor: formData.exteriorColor,
          interiorColor: formData.interiorColor,
          interiorType: formData.interiorType,
          titleStatus: formData.titleStatus
        };
      }

      const description = await generateDescription(
        vehicleInfo,
        formData.miles,
        formData.condition,
        formData.additionalDetails,
        descriptionType
      );

      setDescription(description);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <Car className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Car Sales Description Generator
          </h1>
        </div>

        <div className="mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMethod('vin')}
              className={`px-4 py-2 rounded-lg ${
                method === 'vin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Use VIN
            </button>
            <button
              onClick={() => setMethod('manual')}
              className={`px-4 py-2 rounded-lg ${
                method === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Enter Manually
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {method === 'vin' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Identification Number (VIN)
                </label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) =>
                    setFormData({ ...formData, vin: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  required
                />
              </div>
            ) : (
              <VehicleBasicInfo
                year={formData.year}
                make={formData.make}
                model={formData.model}
                makes={makes}
                models={models}
                isLoadingMakes={isLoadingMakes}
                isLoadingModels={isLoadingModels}
                makeError={makeError}
                modelError={modelError}
                onYearChange={handleYearChange}
                onMakeChange={handleMakeChange}
                onModelChange={(model) => setFormData({ ...formData, model })}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseInt(e.target.value)
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage
                </label>
                <input
                  type="number"
                  value={formData.miles}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      miles: parseInt(e.target.value)
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {method === 'manual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Engine Size
                  </label>
                  <input
                    type="text"
                    value={formData.engineSize}
                    onChange={(e) =>
                      setFormData({ ...formData, engineSize: e.target.value })
                    }
                    placeholder="e.g., 2.0L, V6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) =>
                      setFormData({ ...formData, transmission: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drivetrain
                </label>
                <select
                  value={formData.drivetrain}
                  onChange={(e) =>
                    setFormData({ ...formData, drivetrain: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2WD">2WD</option>
                  <option value="4WD">4WD</option>
                  <option value="AWD">AWD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exterior Color
                </label>
                <select
                  value={formData.exteriorColor}
                  onChange={(e) =>
                    setFormData({ ...formData, exteriorColor: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Color</option>
                  {exteriorColors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interior Color
                </label>
                <select
                  value={formData.interiorColor}
                  onChange={(e) =>
                    setFormData({ ...formData, interiorColor: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Color</option>
                  {interiorColors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interior Type
                </label>
                <select
                  value={formData.interiorType}
                  onChange={(e) =>
                    setFormData({ ...formData, interiorType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Cloth">Cloth</option>
                  <option value="Leather">Leather</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title Status
                </label>
                <select
                  value={formData.titleStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, titleStatus: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Clean">Clean</option>
                  <option value="Salvage">Salvage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                value={formData.additionalDetails}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalDetails: e.target.value
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter any additional details about the vehicle (options, modifications, damage, etc.)"
              />
            </div>

            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setDescriptionType('full')}
                className={`px-4 py-2 rounded-lg ${
                  descriptionType === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Full Description
              </button>
              <button
                type="button"
                onClick={() => setDescriptionType('short')}
                className={`px-4 py-2 rounded-lg ${
                  descriptionType === 'short'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Facebook Marketplace
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Description'}
            </button>
          </form>
        </div>

        {description && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              {descriptionType === 'full' ? 'Full Description' : 'Facebook Marketplace Description'}
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap">
              {description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}