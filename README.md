# 🏪 Supplement Store - Inventory Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-8.0-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A **production-ready** inventory management system for supplement stores with real-time features, secure authentication, and a modern admin dashboard. Built with Next.js 15, TypeScript, and Supabase.

## ✨ Features

### 🎯 **Core Functionality**
- **📦 Inventory Management** - Add, edit, delete products with real-time stock tracking
- **🛒 E-commerce Ready** - Shopping cart, checkout, and order management
- **👥 User Management** - Customer registration, admin approval system
- **💬 Real-time Chat** - Customer support messaging system
- **📊 Analytics Dashboard** - Sales metrics, revenue tracking, and insights
- **🔐 Secure Authentication** - JWT-based auth with role-based access control

### 🎨 **User Experience**
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **⚡ Real-time Updates** - Live data synchronization across all devices
- **🔍 Advanced Search** - Product filtering, categories, and search functionality
- **📈 Pagination** - Efficient data loading with infinite scroll and page navigation
- **🎯 Intuitive UI** - Clean, modern interface with smooth animations

### 🛡️ **Security & Performance**
- **🔒 Row Level Security** - Database-level security policies
- **🔑 Role-based Access** - Admin and customer permission separation
- **📊 Database Indexing** - Optimized queries for fast performance
- **🔄 Caching Strategy** - Efficient data fetching and state management
- **🛡️ Input Validation** - Zod schema validation for all forms

## 🚀 Live Demo

**🌐 [View Live Application](https://next-js-supplement-store.vercel.app/)**

Experience the full functionality of the supplement store:
- **Customer Features**: Browse products, add to cart, checkout with Stripe
- **Admin Panel**: Manage inventory, orders, customers, and messages
- **Real-time Chat**: Live customer support messaging system
- **Responsive Design**: Optimized for all devices

> **Note**: This is a demo environment. Please use the sample admin account for testing.

### 🧪 Demo Credentials

**Admin Access:**
```
Email: admin@supplementstore.com
Password: admin123
```

**What You Can Test:**
- **🛍️ Customer Experience**: Browse products, add to cart, checkout
- **👨‍💼 Admin Panel**: Manage inventory, view orders, handle messages
- **💬 Real-time Chat**: Test the customer support messaging system
- **💳 Stripe Integration**: Complete checkout flow (test mode)

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | [Next.js](https://nextjs.org/) | 15.0 |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.0+ |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | 4.0 |
| **Database** | [Supabase](https://supabase.com/) | 8.0+ |
| **Authentication** | Custom JWT + Supabase | - |
| **State Management** | React Context + Hooks | - |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | - |
| **Icons** | [Heroicons](https://heroicons.com/) | - |
| **Payments** | [Stripe](https://stripe.com/) | Ready |
| **Deployment** | Vercel, Netlify, Railway | Ready |

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Supabase** account (free tier available)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/supplement-store.git
cd supplement-store
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**Required Environment Variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration
JWT_SECRET=your_very_long_random_secret_key_here_minimum_32_characters

# Stripe Configuration (Optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

1. **Go to Supabase Dashboard** → Your Project → SQL Editor
2. **Copy the SQL script** from `production-setup-with-sample-data.sql`
3. **Paste and execute** the entire script
4. **Verify setup** - You should see 1 admin user and 30 sample products

**Default Admin Account:**
```
Email: admin@supplementstore.com
Password: Admin123!
```

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The system includes a complete database structure with:

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **`users`** | User accounts and roles | Admin/customer roles, approval system |
| **`products`** | Product inventory | Stock tracking, categories, images |
| **`orders`** | Customer orders | Status tracking, shipping info |
| **`order_items`** | Order line items | Quantity, pricing, product links |
| **`payments`** | Payment records | Transaction tracking, status |
| **`chat_messages`** | Customer support | Real-time messaging system |

### Database Features:
- **🔐 Row Level Security (RLS)** on all tables
- **📊 Optimized indexes** for fast queries
- **🔄 Real-time subscriptions** for live updates
- **🔒 Password hashing** with bcrypt
- **📝 Audit trails** with created_at/updated_at

## 📱 Application Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── admin/             # Admin panel routes
│   ├── api/               # API endpoints
│   ├── cart/              # Shopping cart
│   ├── messages/          # Customer support
│   ├── orders/            # Order management
│   ├── products/          # Product catalog
│   └── profile/           # User profile
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   └── Navigation.tsx     # Main navigation
├── contexts/               # React contexts
│   └── AuthContext.tsx    # Authentication state
├── lib/                    # Utility functions
│   ├── supabase.ts        # Supabase client
│   ├── utils.ts           # Helper functions
│   └── env.ts             # Environment validation
└── types/                  # TypeScript definitions
    └── database.ts        # Database types
```

## 🔐 Authentication & Security

### Security Features:
- **🔑 JWT-based authentication** with secure token storage
- **👥 Role-based access control** (admin/customer)
- **🔒 Row Level Security** policies for data protection
- **🛡️ Input validation** with Zod schemas
- **🔐 Password hashing** using bcrypt
- **🚫 Protected routes** with middleware

### User Roles:
- **👤 Customer**: Browse products, place orders, view history
- **👨‍💼 Admin**: Full system access, manage inventory, process orders

## 🎨 Customization

### Styling
```bash
# Customize Tailwind CSS
nano tailwind.config.js

# Modify global styles
nano src/app/globals.css
```

### Adding Features
```bash
# Create new component
mkdir src/components/NewFeature
touch src/components/NewFeature/index.tsx

# Add new page
mkdir src/app/new-feature
touch src/app/new-feature/page.tsx
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository
   - Add environment variables
   - Deploy automatically

### Other Platforms

- **Netlify**: `npm run build && netlify deploy`
- **Railway**: Connect repository and deploy
- **DigitalOcean**: App Platform deployment
- **AWS**: Amplify or EC2 deployment

## 📊 Performance Features

- **⚡ Next.js 15** with App Router and Turbopack
- **🖼️ Image optimization** with Next.js Image component
- **📦 Code splitting** and lazy loading
- **🔄 Real-time updates** with Supabase subscriptions
- **💾 Efficient caching** strategies
- **📱 Progressive Web App** ready

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 📈 Monitoring & Analytics

Ready for integration with:
- **📊 Analytics**: Google Analytics, Mixpanel
- **🚨 Error Tracking**: Sentry, LogRocket
- **📈 Performance**: Vercel Analytics, Web Vitals
- **📝 Logging**: Logtail, LogRocket

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines:
- Follow TypeScript best practices
- Use conventional commit messages
- Add JSDoc comments for complex functions
- Ensure responsive design
- Test on multiple devices

## 📚 Documentation

- **[Database Setup Guide](README-DATABASE.md)** - Complete database setup instructions
- **[API Documentation](docs/API.md)** - API endpoints and usage
- **[Component Library](docs/COMPONENTS.md)** - UI component documentation
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment steps

## 🆘 Support & Community

### Getting Help:
- **🐛 Bug Reports**: [Create an issue](https://github.com/yourusername/supplement-store/issues)
- **💡 Feature Requests**: [Request a feature](https://github.com/yourusername/supplement-store/issues)
- **❓ Questions**: [GitHub Discussions](https://github.com/yourusername/supplement-store/discussions)
- **📧 Email**: your-email@example.com

### Community Resources:
- **📖 Documentation**: [Read the docs](https://github.com/yourusername/supplement-store/wiki)
- **💬 Discord**: [Join our community](https://discord.gg/your-server)
- **🐦 Twitter**: [Follow for updates](https://twitter.com/yourusername)

## 🔮 Roadmap

### **Phase 1** (Current) ✅
- [x] Core inventory management
- [x] User authentication system
- [x] Admin dashboard
- [x] Real-time chat support

### **Phase 2** (Next) 🚧
- [ ] Advanced analytics and reporting
- [ ] Multi-language support (i18n)
- [ ] Bulk import/export operations
- [ ] Advanced search and filtering

### **Phase 3** (Future) 🔮
- [ ] Mobile app (React Native)
- [ ] AI-powered inventory optimization
- [ ] Third-party integrations
- [ ] Advanced shipping options

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Supabase Team** for the powerful backend
- **Tailwind CSS** for the utility-first CSS framework
- **Open Source Community** for inspiration and support

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/supplement-store&type=Date)](https://star-history.com/#yourusername/supplement-store&Date)

---

<div align="center">

**Built with ❤️ using modern web technologies**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-8.0-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)

**If this project helps you, please give it a ⭐ star!**

</div> 
