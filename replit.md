# Invoice Generator Pro

## Overview

This is a modern, full-stack invoice generation application built with React, Express, and PostgreSQL. The application allows users to create professional invoices with services, calculate totals with tax, preview invoices in real-time, and export them as PDF documents. It features a clean, responsive design using shadcn/ui components and Tailwind CSS for styling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Hook Form for form state with Zod validation schemas
- **Data Fetching**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for fast bundling
- **Storage Layer**: Abstracted storage interface with in-memory implementation (MemStorage)
- **Session Management**: Prepared for PostgreSQL sessions with connect-pg-simple

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless PostgreSQL
- **Type Safety**: drizzle-zod for runtime validation

### File Structure
- **Client**: React application in `/client` directory
- **Server**: Express backend in `/server` directory  
- **Shared**: Common types and schemas in `/shared` directory
- **Components**: Modular UI components with consistent styling
- **Hooks**: Custom React hooks for reusable logic
- **Pages**: Route-level components for application screens

### Development Workflow
- **Development Server**: Vite dev server with HMR for client, tsx for server
- **Type Checking**: Strict TypeScript configuration with path mapping
- **Code Quality**: ESM modules throughout the stack
- **Error Handling**: Runtime error overlay in development

### Invoice Generation Features
- **Form Management**: Dynamic service addition/removal with validation
- **Real-time Preview**: Live invoice preview as user types
- **PDF Export**: jsPDF with autoTable for professional PDF generation
- **Calculations**: Automatic subtotal, tax, and total calculations
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## External Dependencies

### UI and Styling
- **shadcn/ui**: Complete component system with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe component variants
- **clsx**: Conditional CSS class composition

### Database and ORM
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for PostgreSQL
- **drizzle-kit**: Schema management and migration tools
- **connect-pg-simple**: PostgreSQL session store for Express

### Development Tools
- **Vite**: Build tool with React plugin and error overlay
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **@replit/vite-plugin-cartographer**: Replit integration for development

### Form and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for react-hook-form
- **zod**: Schema validation with TypeScript inference

### PDF Generation
- **jspdf**: Client-side PDF generation
- **jspdf-autotable**: Table plugin for structured invoice layouts

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **cmdk**: Command palette component