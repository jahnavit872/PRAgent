import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/store.json');

// Initialize data file if it doesn't exist
const initializeData = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = {
      products: [
        {
          id: 'prod_1',
          name: 'Wireless Headphones',
          description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
          price: 199.99,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          stock: 50
        },
        {
          id: 'prod_2',
          name: 'Smart Watch',
          description: 'Fitness tracking smart watch with heart rate monitor',
          price: 299.99,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          stock: 30
        },
        {
          id: 'prod_3',
          name: 'Laptop Backpack',
          description: 'Durable water-resistant backpack with laptop compartment',
          price: 49.99,
          category: 'Accessories',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
          stock: 100
        },
        {
          id: 'prod_4',
          name: 'USB-C Hub',
          description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader',
          price: 39.99,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
          stock: 75
        },
        {
          id: 'prod_5',
          name: 'Mechanical Keyboard',
          description: 'RGB mechanical gaming keyboard with blue switches',
          price: 129.99,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
          stock: 40
        },
        {
          id: 'prod_6',
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse with precision tracking',
          price: 29.99,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
          stock: 120
        }
      ],
      users: [],
      carts: [],
      orders: []
    };
    
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
};

export const readData = async () => {
  await initializeData();
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

export const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

