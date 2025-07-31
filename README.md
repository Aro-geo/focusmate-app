# FocusMate AI – - **Responsive Design**: Mobile-first responsive layout with adaptive navigation

## 🔐 Authentication & Securityrt Productivity Assistant

A clean, modern productivity dashboard built for young professionals featuring AI-powered insights, Pomodoro timer, journaling, and analytics with beautiful Framer Motion animations. Full-stack application with Vercel serverless backend and Neon PostgreSQL database.

## 🚀 Features

- **Dashboard**: 3-column layout with daily tasks, AI assistant, Pomodoro timer, and mood tracking
- **Smart Navigation**: Sidebar navigation with clean, modern design
- **Task Management**: Interactive task list with priority levels and completion tracking
- **AI Integration**: GPT-powered responses and productivity tips
- **Pomodoro Timer**: Focus timer with customizable durations and session tracking
- **Mood Tracking**: Daily mood selector for productivity insights
- **Progress Analytics**: Weekly progress tracking and statistics with advanced Chart.js visualizations
- **Smooth Animations**: Beautiful Framer Motion animations throughout the app
- **Database Integration**: Full PostgreSQL database with Supabase for persistent storage
- **Authentication**: Secure JWT-based user authentication with bcrypt password hashing
- **Dark Mode**: Complete dark theme support with system preference detection
- **Responsive Design**: Mobile-first responsive layout with adaptive navigation

## � Authentication & Security

- **JWT Authentication**: Secure token-based authentication with automatic refresh
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Row Level Security**: Database-level user data isolation
- **Input Validation**: Comprehensive validation with Joi schemas
- **CORS Protection**: Secure cross-origin resource sharing
- **SQL Injection Protection**: Parameterized queries throughout

## ⚡ Vercel Serverless Backend

### 🏗️ Backend Architecture
```
api/
├── auth-login.js          # JWT login with rate limiting
├── auth-signup.js         # User registration with validation
└── get-db-host.js         # Secure database host endpoint

lib/
├── db.js                  # Supabase PostgreSQL connection pool

middleware/
├── auth.js                # JWT authentication middleware
└── cors.js                # CORS & security headers

utils/
├── jwt.js                 # JWT token management
├── password.js            # bcrypt password hashing
└── validation.js          # Joi input validation
```

### 🚀 Quick Setup

1. **Clone & Install**:
```bash
git clone <repository-url>
cd focusmate-ai
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env.local
# Edit .env.local with your database and JWT credentials
```

3. **Database Setup**:
```bash
node scripts/db-setup-rls.js
```

4. **Development**:
```bash
npm run dev
```

### 🌩️ Supabase Database Integration

#### Production Database Schema
Includes tables for users, todos, pomodoro sessions, and journal entries with Row Level Security (RLS) policies for user data isolation.

#### Client-side Secure Access
```tsx
// Secure todo management with authentication
const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();
```

#### Server-side API Access
```javascript
// Serverless function database access
const { query } = require('../lib/db');
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** with TypeScript and Vite
- **Framer Motion 10.16.16** for smooth UI transitions
- **Tailwind CSS 3.4.17** with custom design system
- **React Router DOM 6.8.1** for client-side routing
- **Lucide React 0.294.0** for consistent iconography
- **Chart.js with react-chartjs-2** for advanced analytics

### Backend & Database
- **Vercel Serverless Functions** for scalable API endpoints
- **Supabase PostgreSQL** database with real-time subscriptions
- **JWT Authentication** with bcrypt password hashing
- **Node.js with Express** for API middleware

### Security & Validation
- **bcryptjs** for password hashing (12 salt rounds)
- **jsonwebtoken** for JWT token management
- **Joi** for comprehensive input validation
- **CORS & Security Headers** for protection
- **Rate Limiting** to prevent abuse

## 🏗️ Project Structure

```
focusmate-ai/
├── api/                        # Vercel serverless functions
│   ├── auth-login.js          # JWT authentication endpoint
│   ├── auth-signup.js         # User registration endpoint
│   └── get-db-host.js         # Secure database host provider
├── lib/
│   └── db.js                  # Supabase PostgreSQL connection pool
├── middleware/
│   ├── auth.js                # JWT middleware & validation
│   └── cors.js                # CORS & security headers
├── utils/
│   ├── jwt.js                 # JWT token utilities
│   ├── password.js            # Password hashing utilities
│   └── validation.js          # Input validation schemas
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── TodoManager.tsx    # Database-connected todo manager
│   │   ├── TaskManager.tsx    # Advanced task management
│   │   ├── FloatingAssistant.tsx # AI assistant interface
│   │   └── Charts.tsx         # Analytics visualizations
│   ├── pages/                 # Main application pages
│   │   ├── Dashboard.tsx      # Main dashboard with analytics
│   │   ├── Pomodoro.tsx       # Advanced Pomodoro timer
│   │   ├── Journal.tsx        # Journal with AI insights
│   │   ├── Stats.tsx          # Comprehensive analytics
│   │   ├── Login.tsx          # Authentication page
│   │   └── Profile.tsx        # User profile management
│   ├── services/              # API service layer
│   │   ├── ProductionAuthService.js # Frontend auth service
│   │   ├── DatabaseTaskService.ts   # Task database operations
│   │   ├── DatabasePomodoroService.ts # Pomodoro session storage
│   │   ├── OpenAIService.ts   # AI integration service
│   │   └── AnalyticsService.ts # Analytics data processing
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js         # Authentication hook
│   │   ├── useTodos.ts        # Database todo operations
│   │   └── useResponsive.ts   # Responsive design utilities
│   ├── context/               # React context providers
│   │   ├── ThemeContext.tsx   # Dark/Light mode management
│   │   ├── UserContext.tsx    # User state management
│   │   └── DataContext.tsx    # Application data context
│   └── models/                # TypeScript interfaces
│       ├── User.ts            # User data models
│       ├── Task.ts            # Task data models
│       ├── PomodoroSession.ts # Session data models
│       └── JournalEntry.ts    # Journal data models
├── scripts/
│   └── db-setup-rls.js        # Database RLS setup script
├── public/                    # Static assets
├── vercel.json                # Vercel deployment configuration
├── package.json               # Dependencies and scripts
└── .env.example               # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v10+ recommended)
- Supabase PostgreSQL database
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd focusmate-ai
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment setup**:
```bash
cp .env.example .env.local
```

4. **Configure environment variables** in `.env.local`:
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

5. **Set up database with Row Level Security**:
```bash
node scripts/db-setup-rls.js
```

6. **Start development server**:
```bash
npm run dev
```

7. **Open application**:
Navigate to [http://localhost:3000](http://localhost:3000)

### Production Deployment (Vercel)

1. **Deploy to Vercel**:
```bash
npx vercel --prod
```

2. **Set environment variables** in Vercel dashboard:
   - `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/public key
   - `JWT_SECRET` - Secure random string (32+ characters)
   - `NODE_ENV=production`

3. **Verify deployment**:
   - Frontend: https://your-app.vercel.app
   - API Health: https://your-app.vercel.app/api/health

## 🔑 Environment Variables

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_KEY` | Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | Secret key for JWT signing (32+ chars) | `your-super-secret-jwt-key-min-32-characters` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |

## 🎯 Current Features

### ✅ Complete Implementation
- **🔐 JWT Authentication**: Full user registration, login, and session management
- **📊 Dashboard**: Interactive 3-column layout with real-time data and AI insights
- **🍅 Pomodoro Timer**: Advanced timer with session tracking and mood logging
- **📝 Todo Management**: Database-connected CRUD operations with real-time updates
- **📈 Analytics**: Advanced charts showing productivity trends and insights
- **📓 Journal**: Entry management with mood tracking and AI insights
- **👤 User Profile**: Complete profile management with settings
- **🎨 Theme System**: Dark/Light mode with system preference detection
- **📱 Responsive Design**: Mobile-optimized layouts throughout

### 🤖 Advanced AI Features (NEW)
- **🧠 Intelligent Task Analysis**: AI-powered task complexity scoring and duration estimation
- **🎯 Smart Prioritization**: Multi-factor task prioritization with contextual reasoning
- **💡 Context-Aware Insights**: Personalized productivity recommendations based on time, mood, and patterns
- **⚡ Real-time Suggestions**: Dynamic focus tips and optimization strategies
- **📊 Pattern Recognition**: Learning from user behavior to improve recommendations

### 📱 Progressive Web App (PWA) (NEW)
- **🌐 Offline Functionality**: Core features work without internet connection
- **🔄 Background Sync**: Automatic data synchronization when back online
- **📩 Push Notifications**: Configurable productivity reminders and focus alerts
- **⬇️ App Installation**: Install as native app on desktop and mobile devices
- **🔄 Auto Updates**: Seamless app updates with user notification
- **💾 Local Storage**: Intelligent caching for optimal performance

### 🔒 Security Features
- **Password Security**: bcrypt hashing with 12 salt rounds
- **JWT Tokens**: Secure authentication with automatic refresh
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive Joi schema validation
- **SQL Injection Protection**: Parameterized queries throughout
- **CORS Protection**: Proper cross-origin resource sharing
- **Row Level Security**: Database-level user data isolation

### 🌐 API Endpoints
**Authentication & Core**
- `POST /api/auth-signup` - User registration
- `POST /api/auth-login` - User authentication  
- `GET /api/get-db-host` - Secure database host (authenticated)
- `GET /api/health` - API health check

**Advanced AI Features (NEW)**
- `POST /api/ai-analyze-task` - Intelligent task complexity analysis
- `POST /api/ai-prioritize-tasks` - Smart task prioritization
- `POST /api/ai-contextual-insights` - Context-aware productivity insights
- `POST /api/ai-schedule-recommendations` - AI-powered scheduling
- `POST /api/ai-break-suggestions` - Intelligent break recommendations

**PWA & Notifications (NEW)**
- `POST /api/push-subscribe` - Push notification subscription
- `GET /api/offline-sync` - Background data synchronization

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start Vite development server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Database
node scripts/db-setup-rls.js  # Set up Row Level Security
```

## 📱 Features by Page

### Dashboard
- Real-time task overview with completion statistics
- AI-powered productivity insights and recommendations
- Quick Pomodoro session starter with mood tracking
- Daily/weekly progress visualization

### Pomodoro Timer
- Customizable work/break intervals (25/5/15 minutes)
- Session history with mood and productivity tracking
- AI feedback based on session completion
- Task association for focused work sessions

### Analytics
- Productivity trends with Chart.js visualizations
- Task completion rates and patterns
- Mood correlation with productivity metrics
- Weekly/monthly progress reports

### Journal
- Rich text entry creation with mood tagging
- AI-powered insights and reflection prompts
- Search and filter capabilities
- Mood trend analysis over time

### Profile
- User account management and preferences
- Productivity goal setting and tracking
- Achievement system with progress badges
- Theme and notification preferences

## 🎨 Design System

- **Typography**: Inter font family for clean readability
- **Colors**: Custom blue/indigo palette with purple accents
- **Components**: Rounded cards with subtle shadows and gradients
- **Animations**: Smooth Framer Motion transitions throughout
- **Icons**: Consistent Lucide React icon set
- **Theme**: Complete dark/light mode implementation

---

*Built with ❤️ for productivity enthusiasts using modern React, Vercel serverless functions, and Supabase PostgreSQL*

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help getting started:

- 📧 **Email**: support@focusmate-ai.com
- 📚 **Documentation**: [Wiki](https://github.com/Aro-geo/focusmate-app/wiki)
- 🐛 **Bug Reports**: [Issues](https://github.com/Aro-geo/focusmate-app/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Aro-geo/focusmate-app/discussions)

## 🗺️ Roadmap

### 🚀 Upcoming Features
- [ ] **Mobile App**: React Native implementation
- [ ] **Team Collaboration**: Shared workspaces and team analytics
- [✅] **Advanced AI**: Enhanced productivity insights and suggestions (COMPLETED)
- [ ] **Integration Hub**: Connect with popular productivity tools
- [✅] **Offline Mode**: Progressive Web App with offline capabilities (COMPLETED)
- [ ] **Advanced Analytics**: Machine learning-powered insights

### 🏗️ Implementation Priority

#### Phase 1: Core Enhancements (✅ COMPLETED)
1. **🤖 Advanced AI Integration** ✅
   - ✅ Enhanced OpenAI GPT-4 integration
   - ✅ Context-aware productivity suggestions
   - ✅ Intelligent task prioritization
   - ✅ Smart task complexity analysis
   - ✅ Dynamic productivity insights

2. **📱 Progressive Web App (PWA)** ✅
   - ✅ Offline functionality for core features
   - ✅ Service worker implementation
   - ✅ Local data caching and sync
   - ✅ Push notifications support
   - ✅ App installation prompts

#### Phase 2: Collaboration Features
3. **👥 Team Collaboration**
   - Shared workspaces
   - Team productivity metrics
   - Collaborative task management
   - Real-time updates with WebSockets

#### Phase 3: Advanced Features
4. **📊 Advanced Analytics & ML**
   - Predictive productivity insights
   - Machine learning recommendations
   - Behavior pattern analysis
   - Custom dashboard widgets

5. **🔗 Integration Hub**
   - Slack, Discord, Teams integration
   - Google Calendar, Outlook sync
   - Notion, Trello, Asana connectors
   - GitHub, GitLab project tracking

6. **📱 Mobile App**
   - React Native implementation
   - Cross-platform compatibility
   - Native device features
   - Synchronized data across devices

### 🔄 Recent Updates
- ✅ **v1.0.0**: Initial release with full authentication and database integration
- ✅ **JWT Security**: Implemented secure token-based authentication
- ✅ **Vercel Deployment**: Production-ready serverless backend
- ✅ **Supabase Integration**: Scalable PostgreSQL database with RLS
- 🚀 **v1.1.0**: Advanced AI features and PWA capabilities (Current)
  - ✅ Enhanced AI task analysis with complexity scoring
  - ✅ Intelligent task prioritization with multi-factor scoring
  - ✅ Context-aware productivity insights
  - ✅ Progressive Web App (PWA) implementation
  - ✅ Offline functionality with service workers
  - ✅ Background sync for offline actions
  - ✅ Push notifications for productivity reminders
  - ✅ App installation prompts and update management

## 🙏 Acknowledgments

- **Vercel** for excellent serverless function hosting
- **Supabase** for providing scalable PostgreSQL database
- **Framer Motion** for beautiful animation library
- **Tailwind CSS** for rapid UI development
- **React** team for the amazing framework
- **Community** for feedback and contributions
