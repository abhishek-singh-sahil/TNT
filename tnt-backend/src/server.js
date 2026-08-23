import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TNT E-Commerce Backend running on http://localhost:${PORT}`);
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
});
