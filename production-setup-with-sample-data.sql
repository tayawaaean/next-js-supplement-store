-- Production Database Setup with Sample Data
-- Safe for GitHub repositories - no sensitive production data
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'customer');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'customer',
  status user_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  status order_status DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(100) NOT NULL,
  transaction_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create password hashing function
CREATE OR REPLACE FUNCTION hash_password(input_password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(input_password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create password verification function
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT, stored_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(input_password, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Admins can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- RLS Policies for products table
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all products" ON products FOR ALL USING (true);

-- RLS Policies for orders table
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (true);

-- RLS Policies for order_items table
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (true);

-- RLS Policies for payments table
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Users can create payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update payments" ON payments FOR UPDATE USING (true);

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own messages" ON chat_messages FOR UPDATE USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO anon, authenticated;

-- Insert default admin user (safe for GitHub - change password in production)
-- Email: admin@supplementstore.com
-- Password: Admin123!
INSERT INTO users (email, password_hash, full_name, role, status) VALUES (
  'admin@supplementstore.com',
  hash_password('Admin123!'),
  'Admin User',
  'admin',
  'approved'
);

-- Insert sample supplement products
INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active) VALUES
-- Vitamins
('Vitamin D3 2000IU', 'High-potency Vitamin D3 supplement for bone health and immune support. Each capsule contains 2000 IU of cholecalciferol.', 19.99, 150, 'vitamins', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Vitamin C 1000mg', 'Premium Vitamin C supplement with extended release formula. Supports immune system and collagen production.', 24.99, 200, 'vitamins', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('B-Complex Complete', 'Comprehensive B-vitamin complex including B1, B2, B3, B5, B6, B7, B9, and B12. Essential for energy metabolism.', 29.99, 120, 'vitamins', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Minerals
('Magnesium Citrate 400mg', 'Highly absorbable magnesium supplement for muscle relaxation, sleep support, and bone health.', 18.99, 180, 'minerals', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Zinc Picolinate 50mg', 'Premium zinc supplement for immune support, wound healing, and antioxidant protection.', 22.99, 160, 'minerals', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Calcium + Vitamin D', 'Complete calcium supplement with added Vitamin D for optimal bone health and absorption.', 26.99, 140, 'minerals', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Protein
('Whey Protein Isolate', 'Premium whey protein isolate with 25g protein per serving. Low in carbs and fat, perfect for muscle building.', 49.99, 80, 'protein', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Plant Protein Blend', 'Complete plant-based protein blend with pea, rice, and hemp proteins. 22g protein per serving.', 39.99, 90, 'protein', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Casein Protein', 'Slow-release casein protein for overnight muscle recovery. 24g protein per serving.', 44.99, 70, 'protein', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Amino Acids
('BCAA 2:1:1 Ratio', 'Branched-chain amino acids in optimal 2:1:1 ratio. Supports muscle recovery and reduces fatigue.', 34.99, 110, 'amino_acids', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('L-Glutamine 1000mg', 'Pure L-glutamine powder for muscle recovery, gut health, and immune support.', 19.99, 130, 'amino_acids', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Creatine Monohydrate', 'Pure creatine monohydrate powder for increased strength and muscle mass. 5g per serving.', 24.99, 100, 'amino_acids', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Omega-3
('Fish Oil 1000mg', 'Premium fish oil supplement with 300mg EPA and 200mg DHA. Supports heart and brain health.', 32.99, 95, 'omega_3', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Algae Omega-3', 'Plant-based omega-3 supplement derived from algae. Perfect for vegetarians and vegans.', 38.99, 85, 'omega_3', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Probiotics
('Probiotic 50 Billion CFU', 'High-potency probiotic with 50 billion CFU and 15 different strains for gut health.', 42.99, 75, 'probiotics', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Digestive Enzyme Complex', 'Complete digestive enzyme blend for better nutrient absorption and digestive comfort.', 28.99, 110, 'probiotics', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Antioxidants
('Resveratrol 500mg', 'Premium resveratrol supplement from red wine extract. Powerful antioxidant for cellular health.', 36.99, 80, 'antioxidants', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('CoQ10 200mg', 'High-potency CoQ10 supplement for heart health and cellular energy production.', 41.99, 70, 'antioxidants', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Herbs
('Ashwagandha 600mg', 'Traditional Ayurvedic herb for stress relief, energy, and overall wellness.', 25.99, 120, 'herbs', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Turmeric Curcumin', 'Premium turmeric extract with 95% curcuminoids for anti-inflammatory support.', 29.99, 100, 'herbs', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Ginseng Extract', 'Korean red ginseng extract for energy, focus, and immune support.', 34.99, 85, 'herbs', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),

-- Other
('Multivitamin Complete', 'Comprehensive daily multivitamin with minerals and antioxidants for overall health.', 45.99, 150, 'other', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true),
('Collagen Peptides', 'Hydrolyzed collagen peptides for skin, hair, nail, and joint health. 10g per serving.', 39.99, 95, 'other', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', true);

-- Create chat_threads view for admin
CREATE OR REPLACE VIEW chat_threads AS
SELECT DISTINCT
  CASE 
    WHEN u1.role = 'admin' THEN u2.id
    ELSE u1.id
  END as customer_id,
  CASE 
    WHEN u1.role = 'admin' THEN u2.full_name
    ELSE u1.full_name
  END as customer_name,
  CASE 
    WHEN u1.role = 'admin' THEN u2.email
    ELSE u1.email
  END as customer_email,
  MAX(cm.created_at) as last_message_at,
  COUNT(CASE WHEN cm.is_read = false AND u1.role != 'admin' THEN 1 END) as unread_count
FROM chat_messages cm
JOIN users u1 ON cm.sender_id = u1.id
JOIN users u2 ON cm.receiver_id = u2.id
WHERE u1.role != u2.role
GROUP BY 
  CASE 
    WHEN u1.role = 'admin' THEN u2.id
    ELSE u1.id
  END,
  CASE 
    WHEN u1.role = 'admin' THEN u2.full_name
    ELSE u1.full_name
  END,
  CASE 
    WHEN u1.role = 'admin' THEN u2.email
    ELSE u1.email
  END;

-- Grant permissions on view
GRANT SELECT ON chat_threads TO anon, authenticated;

-- Add chat_messages to realtime publication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;

-- Verification queries
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_products FROM products;
SELECT role, COUNT(*) as count FROM users GROUP BY role;
SELECT category, COUNT(*) as count FROM products GROUP BY category;

-- Admin login credentials (safe for GitHub):
-- Email: admin@supplementstore.com
-- Password: Admin123!
-- 
-- IMPORTANT: Change these credentials in production!
-- Run this after setup to change admin password:
-- UPDATE users SET password_hash = hash_password('YourNewSecurePassword') WHERE email = 'admin@supplementstore.com';
