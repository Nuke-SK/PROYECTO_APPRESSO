import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

// DEFINIR LA CONFIGURACIÓN DE DRIZZLE-KIT PARA LA BASE DE DATOS POSTGRESQL
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  schema: './src/schemas/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});