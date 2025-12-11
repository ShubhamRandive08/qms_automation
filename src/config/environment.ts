import dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
const env = process.env.ENV || 'dev';
const envFile = `.env.${env}`;

// Load the appropriate .env file
const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

if (result.error) {
  console.warn(`⚠️ ${envFile} not found, trying default .env file`);
  dotenv.config(); // Load default .env
}

export interface EnvironmentConfig {
  BASE_URL: string ;
  USERNAME1: string ;
  PASSWORD1: string ;
  ENV: string ;
  HEADLESS: boolean;
  TIMEOUT: number ;
}

export const config: EnvironmentConfig = {
  BASE_URL: process.env.BASE_URL! || 'https://opensourc-demo.orangehrmlive.com' ,
  USERNAME1: process.env.USERNAME1! || 'Admin',
  PASSWORD1: process.env.PASSWORD1! || 'admin123',
  ENV: process.env.ENV! || 'QA',
  HEADLESS: process.env.HEADLESS !== 'false', // Default to true
  TIMEOUT: parseInt(process.env.TIMEOUT || '30000', 10)
};

// Log loaded config (without password)
// console.log('🔧 Environment Configuration:');
// console.log(`   Environment: ${config.ENV}`);
// console.log(`   Base URL: ${config.BASE_URL}`);
// console.log(`   Username: ${config.USERNAME1}`);
// console.log(`   Headless: ${config.HEADLESS}`);
// console.log(`   Timeout: ${config.TIMEOUT}ms`);