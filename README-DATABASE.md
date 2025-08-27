# Database Setup Guide

This guide explains how to set up your supplement store database using the provided SQL script.

## 🚀 Quick Start

1. **Copy the SQL script** from `production-setup-with-sample-data.sql`
2. **Run it in Supabase SQL Editor** (Database → SQL Editor)
3. **Login with admin account** (see credentials below)

## 📋 What's Included

### Database Schema
- ✅ **Users table** - Customer and admin accounts
- ✅ **Products table** - Supplement inventory
- ✅ **Orders table** - Customer orders
- ✅ **Order items table** - Order line items
- ✅ **Payments table** - Payment records
- ✅ **Chat messages table** - Customer support chat

### Security Features
- 🔒 **Row Level Security (RLS)** enabled on all tables
- 🔐 **Password hashing** using bcrypt (pgcrypto)
- 🛡️ **Proper permissions** for authenticated users
- 🔑 **Role-based access control** (admin/customer)

### Sample Data
- 👤 **Admin account** ready to use
- 🛍️ **30 sample products** across 8 categories
- 📱 **Real-time chat** setup for customer support

## 🔑 Admin Login Credentials

**⚠️ IMPORTANT: These are safe for GitHub but change in production!**

```
Email: admin@supplementstore.com
Password: Admin123!
```

## 📁 File Structure

```
├── production-setup-with-sample-data.sql  # Main database setup
├── README-DATABASE.md                     # This file
└── .env.example                          # Environment variables template
```

## 🛠️ Setup Instructions

### 1. Supabase Setup
1. Go to your Supabase project dashboard
2. Navigate to **Database → SQL Editor**
3. Copy and paste the entire SQL script
4. Click **Run** to execute

### 2. Verify Setup
After running the script, you should see:
- ✅ "Database setup complete!" message
- ✅ 1 admin user created
- ✅ 30 products created
- ✅ All tables and functions created

### 3. Test Admin Login
1. Go to your app's signin page
2. Use the admin credentials above
3. You should be redirected to the admin dashboard

## 🔧 Customization

### Change Admin Password
```sql
UPDATE users 
SET password_hash = hash_password('YourNewSecurePassword') 
WHERE email = 'admin@supplementstore.com';
```

### Add More Products
```sql
INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active) 
VALUES ('Product Name', 'Description', 29.99, 100, 'category', 'image_url', true);
```

### Modify Categories
```sql
-- Update existing products
UPDATE products SET category = 'new_category' WHERE category = 'old_category';
```

## 🚨 Production Security Checklist

Before deploying to production:

- [ ] Change admin password
- [ ] Review RLS policies
- [ ] Set up proper environment variables
- [ ] Enable Supabase Auth (if using)
- [ ] Set up database backups
- [ ] Configure monitoring and logging

## 📊 Database Statistics

After setup, you'll have:
- **1 admin user** (approved status)
- **30 sample products** across categories:
  - Vitamins (3 products)
  - Minerals (3 products)
  - Protein (3 products)
  - Amino Acids (3 products)
  - Omega-3 (2 products)
  - Probiotics (2 products)
  - Antioxidants (2 products)
  - Herbs (3 products)
  - Other (2 products)

## 🆘 Troubleshooting

### Common Issues

**"Extension pgcrypto does not exist"**
- Make sure you're using Supabase (PostgreSQL 15+)
- The script includes `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

**"Permission denied"**
- Run the script as a database owner
- Check that RLS policies are correctly applied

**"Function hash_password does not exist"**
- Ensure the script ran completely
- Check the function creation section

### Need Help?
1. Check the Supabase logs
2. Verify all SQL statements executed successfully
3. Ensure you have proper database permissions

## 🔄 Reset Database

To start fresh:
```sql
-- Drop everything and recreate
\i production-setup-with-sample-data.sql
```

## 📝 Notes

- This script is **safe for GitHub** - no sensitive production data
- All passwords are hashed using bcrypt
- Sample data uses placeholder images from Unsplash
- RLS policies are permissive for development (can be tightened for production)

---

**Happy coding! 🎉**
