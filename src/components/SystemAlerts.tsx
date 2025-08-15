import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Bell,
  BellOff,
  Clock,
  Zap,
  Database,
  Users,
  Activity,
  Settings,
  RefreshCw
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  dismissed?: boolean;
}

const SystemAlerts: React.FC = () => {
  const [alerts] = useState<Alert[]>([]);

  return (
    <div className="system-alerts">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="alert"
          >
            <div className="flex items-center space-x-2">
              {alert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {alert.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
              {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {alert.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
              <span>{alert.title}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SystemAlerts;