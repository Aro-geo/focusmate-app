# FocusMate AI – Intelligent Productivity Assistant

A clean, modern productivity dashboard built for young professionals featuring AI-powered insights, Pomodoro timer, journaling, and analytics with beautiful Framer Motion animations. Full-stack application with Firebase backend and Firestore database.

## 🚀 Features

- **Dashboard**: 3-column layout with daily tasks, AI assistant, Pomodoro timer, and mood tracking
- **Smart Navigation**: Sidebar navigation with clean, modern design
- **Task Management**: Interactive task list with priority levels and completion tracking
- **AI Integration**: GPT-powered responses and productivity tips
- **Pomodoro Timer**: Focus timer with customizable durations and session tracking
- **Mood Tracking**: Daily mood selector for productivity insights
- **Progress Analytics**: Weekly progress tracking and statistics with advanced Chart.js visualizations
- **Smooth Animations**: Beautiful Framer Motion animations throughout the app
- **Database Integration**: Full Firebase Firestore database with real-time updates
- **Dark Mode**: Complete dark theme support with system preference detection
- **Responsive Design**: Mobile-first responsive layout with adaptive navigation

## 🏗️ Project Structure

```
focusmate-ai/
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── TodoManager.tsx    # Firebase-connected todo manager
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
│   ├── services/              # Service layer
│   │   ├── FirebaseService.ts # Firebase Firestore operations
│   │   ├── OpenAIService.ts   # AI integration service
│   │   └── AnalyticsService.ts # Analytics data processing
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js         # Authentication hook
│   │   ├── useTodos.ts        # Firebase todo operations
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
├── public/                    # Static assets
├── firebase.json              # Firebase hosting configuration
├── package.json               # Dependencies and scripts
└── .env.example               # Environment variables template
```

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** with TypeScript and Vite
- **Framer Motion 10.16.16** for smooth UI transitions
- **Tailwind CSS 3.4.17** with custom design system
- **React Router DOM 6.8.1** for client-side routing
- **Lucide React 0.294.0** for consistent iconography
- **Chart.js with react-chartjs-2** for advanced analytics

### Backend & Database
- **Firebase Hosting** for static site deployment
- **Firebase Firestore** for real-time NoSQL database
- **Firebase Analytics** for user behavior tracking

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v10+ recommended)
- Firebase account

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

3. **Firebase setup**:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore database
   - Enable Firebase Hosting
   - Copy your Firebase config from Project Settings

4. **Start development server**:
```bash
npm run dev
```

5. **Open application**:
Navigate to [http://localhost:3000](http://localhost:3000)

### Production Deployment (Firebase)

1. **Install Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Initialize Firebase**:
```bash
firebase init
```

4. **Build and deploy**:
```bash
npm run build
firebase deploy
```

## 🎯 Current Features

### ✅ Complete Implementation
- **📊 Dashboard**: Interactive 3-column layout with real-time data and AI insights
- **🍅 Pomodoro Timer**: Advanced timer with session tracking and mood logging
- **📝 Todo Management**: Firebase-connected CRUD operations with real-time updates
- **📈 Analytics**: Advanced charts showing productivity trends and insights
- **📓 Journal**: Entry management with mood tracking and AI insights
- **👤 User Profile**: Complete profile management with settings
- **🎨 Theme System**: Dark/Light mode with system preference detection
- **📱 Responsive Design**: Mobile-optimized layouts throughout

### 🤖 Advanced AI Features
- **🧠 Intelligent Task Analysis**: AI-powered task complexity scoring and duration estimation
- **🎯 Smart Prioritization**: Multi-factor task prioritization with contextual reasoning
- **💡 Context-Aware Insights**: Personalized productivity recommendations based on time, mood, and patterns
- **⚡ Real-time Suggestions**: Dynamic focus tips and optimization strategies
- **📊 Pattern Recognition**: Learning from user behavior to improve recommendations

### 📱 Progressive Web App (PWA)
- **🌐 Offline Functionality**: Core features work without internet connection
- **🔄 Background Sync**: Automatic data synchronization when back online
- **📩 Push Notifications**: Configurable productivity reminders and focus alerts
- **⬇️ App Installation**: Install as native app on desktop and mobile devices
- **🔄 Auto Updates**: Seamless app updates with user notification
- **💾 Local Storage**: Intelligent caching for optimal performance

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start Vite development server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Firebase
firebase serve           # Serve locally with Firebase
firebase deploy          # Deploy to Firebase Hosting
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

## 🗺️ Roadmap

### 🚀 Upcoming Features
- [ ] **Mobile App**: React Native implementation
- [ ] **Team Collaboration**: Shared workspaces and team analytics
- [ ] **Integration Hub**: Connect with popular productivity tools
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
   - Real-time updates

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

---

*Built with ❤️ for productivity enthusiasts using modern React, Firebase, and AI*

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

## 🙏 Acknowledgments

- **Firebase** for excellent hosting and database services
- **Framer Motion** for beautiful animation library
- **Tailwind CSS** for rapid UI development
- **React** team for the amazing framework
- **Community** for feedback and contributions