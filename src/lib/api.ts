import { z } from 'zod';
import OpenAI from 'openai';

const VIN_API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

export const vinSchema = z.string().length(17);
export const yearSchema = z.number().min(1900).max(new Date().getFullYear() + 1);
export const makeSchema = z.string().min(1);
export const modelSchema = z.string().min(1);
export const milesSchema = z.number().min(0);
export const priceSchema = z.number().min(0);
export const conditionSchema = z.enum(['Excellent', 'Good', 'Fair', 'Poor']);
export const drivetrainSchema = z.enum(['2WD', '4WD', 'AWD']);
export const transmissionSchema = z.enum(['Automatic', 'Manual']);
export const interiorTypeSchema = z.enum(['Leather', 'Cloth']);
export const titleStatusSchema = z.enum(['Clean', 'Salvage']);

export type VehicleInfo = {
  year: number;
  make: string;
  model: string;
  trim?: string;
  engineSize?: string;
  transmission?: string;
  drivetrain?: string;
  exteriorColor?: string;
  interiorColor?: string;
  interiorType?: string;
  titleStatus?: string;
  price?: number;
};

const COMMON_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 
  'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'MINI', 
  'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 
  'Volkswagen', 'Volvo'
];

const COMMON_COLORS = {
  exterior: [
    'Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 
    'Beige', 'Yellow', 'Orange', 'Purple', 'Bronze', 'Burgundy', 'Navy'
  ],
  interior: [
    'Black', 'Gray', 'Beige', 'Brown', 'Tan', 'White', 'Red', 'Blue', 'Cream'
  ]
};

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Create OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
}

export async function getMakesForYear(year: number): Promise<string[]> {
  try {
    yearSchema.parse(year);
    return COMMON_MAKES;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid year selected');
    }
    throw error;
  }
}

export async function getModelsForMakeYear(make: string, year: number): Promise<string[]> {
  try {
    const validYear = yearSchema.parse(year);
    const validMake = makeSchema.parse(make);
    
    const response = await fetch(
      `${VIN_API_BASE}/GetModelsForMakeYear/make/${validMake}/modelyear/${validYear}?format=json`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.Results?.length) {
      throw new Error('No models found for the selected make and year');
    }
    
    // Deduplicate models by converting to Set and back to array
    const uniqueModels = Array.from(new Set(
      data.Results.map((model: { Model_Name: string }) => model.Model_Name)
    )).sort();
    
    return uniqueModels;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid make or year selected');
    }
    throw error instanceof Error ? error : new Error('Failed to fetch models');
  }
}

export const getCommonColors = () => COMMON_COLORS;

export async function decodeVIN(vin: string): Promise<VehicleInfo> {
  try {
    const validVin = vinSchema.parse(vin);
    const response = await fetch(
      `${VIN_API_BASE}/DecodeVinValues/${validVin}?format=json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to decode VIN');
    }

    const data = await response.json();
    const result = data.Results[0];

    if (result.ErrorCode !== '0') {
      throw new Error(result.ErrorText || 'Invalid VIN');
    }

    return {
      year: parseInt(result.ModelYear),
      make: result.Make,
      model: result.Model,
      trim: result.Trim,
      engineSize: result.DisplacementL,
      transmission: result.TransmissionStyle,
      drivetrain: result.DriveType
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid VIN format. Please enter a 17-character VIN.');
    }
    throw error instanceof Error ? error : new Error('Failed to decode VIN');
  }
}

export async function generateDescription(
  vehicleInfo: VehicleInfo,
  miles: number,
  condition: string,
  additionalDetails: string,
  type: 'full' | 'short' = 'full'
): Promise<string> {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }

    milesSchema.parse(miles);
    conditionSchema.parse(condition);

    const formattedPrice = vehicleInfo.price 
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vehicleInfo.price)
      : 'Contact for price';

    const prompt = type === 'full' 
      ? `Create a compelling, detailed sales description for a ${vehicleInfo.year} ${
          vehicleInfo.make
        } ${vehicleInfo.model} with ${miles.toLocaleString()} miles in ${condition} condition.

        Specifications:
        - Price: ${formattedPrice}
        - Engine: ${vehicleInfo.engineSize || 'N/A'}
        - Transmission: ${vehicleInfo.transmission || 'N/A'}
        - Drivetrain: ${vehicleInfo.drivetrain || 'N/A'}
        - Exterior Color: ${vehicleInfo.exteriorColor || 'N/A'}
        - Interior: ${vehicleInfo.interiorColor || 'N/A'} ${vehicleInfo.interiorType || 'N/A'}
        - Title Status: ${vehicleInfo.titleStatus || 'N/A'}
        - Trim: ${vehicleInfo.trim || 'N/A'}

        Additional details: ${additionalDetails}

        Please create a professional, engaging, and detailed description that highlights the vehicle's features, condition, and specifications. Include the price and title status in the description.`
      : `Create a concise, Facebook Marketplace-optimized description for a ${vehicleInfo.year} ${
          vehicleInfo.make
        } ${vehicleInfo.model} (${miles.toLocaleString()} miles, ${condition} condition).
        
        Key specs: ${vehicleInfo.engineSize || ''} ${vehicleInfo.transmission || ''} ${vehicleInfo.drivetrain || ''}, 
        ${vehicleInfo.exteriorColor || ''} exterior, ${vehicleInfo.interiorColor || ''} ${vehicleInfo.interiorType || ''} interior. 
        ${vehicleInfo.titleStatus || 'Clean'} title. Price: ${formattedPrice}
        
        Additional notes: ${additionalDetails}
        
        Keep it brief but compelling, focusing on key selling points. Limit to 2-3 short paragraphs.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
    });

    return completion.choices[0].message.content || 'Failed to generate description';
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Invalid input data. Please check your entries.');
    }
    throw error instanceof Error ? error : new Error('Failed to generate description');
  }
}