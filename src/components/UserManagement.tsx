import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Activity,
  Shield,
  Edit,
  Trash2,
  Eye,
  Download
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'premium' | 'admin';
  joinDate: Date;
  lastLogin: Date;
  totalSessions: number;
  totalJournalEntries: number;
  aiRequestsCount: number;
  subscription?: {
    plan: string;
    status: 'active' | 'cancelled' | 'expired';
    expiresAt: Date;
  };
}

interface UserManagementProps {
  darkMode: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ darkMode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'premium' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock user data - in production this would come from the database
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'geokullo@gmail.com',
        name: 'George Okullo',
        status: 'active',
        role: 'admin',
        joinDate: new Date('2024-01-15'),
        lastLogin: new Date(),
        totalSessions: 245,
        totalJournalEntries: 89,
        aiRequestsCount: 567,
        subscription: {
          plan: 'Premium',
          status: 'active',
          expiresAt: new Date('2025-01-15')
        }
      },
      {
        id: '2',
        email: 'john.doe@example.com',
        name: 'John Doe',
        status: 'active',
        role: 'premium',
        joinDate: new Date('2024-02-20'),
        lastLogin: new Date(Date.now() - 3600000),
        totalSessions: 156,
        totalJournalEntries: 67,
        aiRequestsCount: 234,
        subscription: {
          plan: 'Premium',
          status: 'active',
          expiresAt: new Date('2024-12-20')
        }
      },
      {
        id: '3',
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        status: 'active',
        role: 'user',
        joinDate: new Date('2024-03-10'),
        lastLogin: new Date(Date.now() - 86400000),
        totalSessions: 89,
        totalJournalEntries: 34,
        aiRequestsCount: 123
      },
      {
        id: '4',
        email: 'inactive.user@example.com',
        name: 'Inactive User',
        status: 'inactive',
        role: 'user',
        joinDate: new Date('2024-01-05'),
        lastLogin: new Date(Date.now() - 30 * 86400000),
        totalSessions: 12,
        totalJournalEntries: 3,
        aiRequestsCount: 8
      }
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'inactive': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'suspended': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20';
      case 'premium': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      case 'user': return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const handleUserAction = (action: string, user: User) => {
    console.log(`${action} user:`, user);
    // Implement user actions here
  };

  const exportUsers = () => {
    const csvContent = [
      'Name,Email,Status,Role,Join Date,Last Login,Sessions,Journal Entries,AI Requests',
      ...filteredUsers.map(user => 
        `${user.name},${user.email},${user.status},${user.role},${user.joinDate.toLocaleDateString()},${user.lastLogin.toLocaleDateString()},${user.totalSessions},${user.totalJournalEntries},${user.aiRequestsCount}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-4 text-indigo-500" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              User Management
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {filteredUsers.length} of {users.length} users
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportUsers}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  User
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Role
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Activity
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Last Login
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                          user.role === 'premium' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {user.name}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {user.totalSessions} sessions
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.aiRequestsCount} AI requests
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {user.lastLogin.toLocaleDateString()}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {user.lastLogin.toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction('edit', user)}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction('suspend', user)}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-2xl w-full mx-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  User Details
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Name
                    </label>
                    <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.name}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Total Sessions
                    </label>
                    <p className={`mt-1 text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.totalSessions}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Journal Entries
                    </label>
                    <p className={`mt-1 text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.totalJournalEntries}
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      AI Requests
                    </label>
                    <p className={`mt-1 text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.aiRequestsCount}
                    </p>
                  </div>
                </div>

                {selectedUser.subscription && (
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Subscription Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Plan:</span>
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedUser.subscription.plan}</p>
                      </div>
                      <div>
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status:</span>
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedUser.subscription.status}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;