# Supplement Store - Inventory Management System

A comprehensive, production-ready inventory management system for supplement stores built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

### Admin Panel
- **Dashboard**: Overview of store performance, sales metrics, and key indicators
- **Product Management**: Add, edit, delete, and manage product inventory
- **Order Management**: Process orders, update statuses, and track shipments
- **Customer Management**: View customer profiles and order history
- **Message Center**: Handle customer inquiries and support requests
- **Payment Management**: Track payment statuses and manage refunds
- **Stock Management**: Monitor inventory levels and low stock alerts

### Customer Features
- **Product Catalog**: Browse products with advanced filtering and search
- **Shopping Cart**: Add items and manage quantities
- **Order Tracking**: Real-time order status updates and tracking
- **Profile Management**: Update personal information and view order history
- **Customer Support**: Send messages to admin team

### Technical Features
- **Authentication**: Secure user authentication with Supabase Auth
- **Real-time Updates**: Live data synchronization across the application
- **Responsive Design**: Mobile-first design that works on all devices
- **Type Safety**: Full TypeScript implementation for better development experience
- **Security**: Row Level Security (RLS) policies for data protection
- **Performance**: Optimized queries and efficient data fetching

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context + Hooks
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Notifications**: React Hot Toast
- **Payments**: Stripe integration (ready for implementation)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payment processing)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd supplement-store
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env.local
```

Update `.env.local` with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Execute the SQL script

### 5. Create Admin User

1. Sign up with your admin email through the application
2. Go to Supabase SQL Editor and run:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The system includes the following main tables:

- **profiles**: User profiles and roles
- **products**: Product inventory and details
- **orders**: Customer orders and status
- **order_items**: Individual items in orders
- **payments**: Payment information and status
- **customer_messages**: Support ticket system

## 🔐 Authentication & Security

- **Row Level Security (RLS)**: Database-level security policies
- **Role-based Access**: Admin and customer role separation
- **Secure API**: Protected routes and data access
- **JWT Tokens**: Secure authentication with Supabase

## 📱 Pages & Routes

### Public Routes
- `/` - Homepage
- `/products` - Product catalog
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page

### Customer Routes (Authenticated)
- `/profile` - User profile
- `/orders` - Order history
- `/cart` - Shopping cart

### Admin Routes (Admin Role Required)
- `/admin/dashboard` - Admin dashboard
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/customers` - Customer management
- `/admin/messages` - Message center

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. You can customize:
- Color scheme in `tailwind.config.js`
- Component styles in individual component files
- Global styles in `src/app/globals.css`

### Adding New Features
- Create new components in `src/components/`
- Add new pages in `src/app/`
- Update types in `src/types/database.ts`
- Add new database tables as needed

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Performance Optimization

- **Image Optimization**: Next.js built-in image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Database Indexing**: Optimized database queries
- **Caching**: Efficient data fetching and caching strategies

## 🔧 Development

### Code Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── styles/             # Global styles and CSS
```

### Adding New Components

1. Create component file in `src/components/`
2. Export as default function
3. Import and use in pages

### Database Changes

1. Update `database-schema.sql`
2. Modify types in `src/types/database.ts`
3. Update components that use the data

## 🧪 Testing

The application is ready for testing frameworks:
- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright or Cypress
- **API Testing**: Supertest

## 📈 Monitoring & Analytics

Ready for integration with:
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics, Mixpanel
- **Performance**: Vercel Analytics
- **Logging**: LogRocket, Logtail

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Future Enhancements

- **Multi-language Support**: Internationalization (i18n)
- **Advanced Analytics**: Sales reports and insights
- **Inventory Alerts**: Automated low stock notifications
- **Bulk Operations**: Import/export product data
- **API Integration**: Third-party shipping and payment providers
- **Mobile App**: React Native companion app

---

Built with ❤️ using modern web technologies for the best developer and user experience.
"# next-js-supplement-store" 
