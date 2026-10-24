import React from 'react';
import {
  LayoutGrid,
  GitCompare,
  Layers,
  Sparkles,
  Plus,
  Bell,
  Settings,
  Sliders,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentView: 'overview' | 'run_facts' | 'compare' | 'explorer' | 'insights';
  onSelectView: (view: 'overview' | 'run_facts' | 'compare' | 'explorer' | 'insights') => void;
  onOpenCreateExp: () => void;
  onOpenImportExport: () => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenCreateExp,
  onOpenImportExport,
  unreadCount = 1
}) => {
  return (
    <aside className="sidebar-rail">
      <div className="sidebar-top">
        {/* Logo crest */}
        <div
          className="sidebar-logo"
          title="ExperimentPilot"
          onClick={() => onSelectView('overview')}
        >
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#132240" />
            <path
              d="M16 6C10.4772 6 6 10.4772 6 16C6 21.5228 10.4772 26 16 26C18.5 26 21 24.5 21 21.5C21 19.5 19.5 18.5 18 17C16.5 15.5 15 14 15 12C15 9.5 18.5 9 18.5 9"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="3" fill="#8b5cf6" />
          </svg>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-icon-btn ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => onSelectView('overview')}
            title="Overview & Benchmarks"
          >
            <LayoutGrid size={22} />
          </button>

          <button
            className={`sidebar-icon-btn ${currentView === 'run_facts' ? 'active' : ''}`}
            onClick={() => onSelectView('run_facts')}
            title="Run Facts & Experiment Manager"
          >
            <Sliders size={22} />
          </button>

          <button
            className={`sidebar-icon-btn ${currentView === 'compare' ? 'active' : ''}`}
            onClick={() => onSelectView('compare')}
            title="Model Comparison"
          >
            <GitCompare size={22} />
          </button>

          <button
            className={`sidebar-icon-btn ${currentView === 'explorer' ? 'active' : ''}`}
            onClick={() => onSelectView('explorer')}
            title="Model Behavior Explorer"
          >
            <Layers size={22} />
          </button>

          <button
            className={`sidebar-icon-btn ${currentView === 'insights' ? 'active' : ''}`}
            onClick={() => onSelectView('insights')}
            title="AI Experiment Insights"
          >
            <Sparkles size={22} />
          </button>

          <button
            className="sidebar-icon-btn"
            onClick={onOpenImportExport}
            title="Import / Export Data"
          >
            <Database size={20} />
          </button>
        </nav>
      </div>

      <div className="sidebar-bottom">
        {/* Plus Action Button */}
        <button
          className="sidebar-plus-btn"
          onClick={onOpenCreateExp}
          title="New Experiment"
        >
          <Plus size={22} strokeWidth={2.8} />
        </button>

        {/* Notification Bell */}
        <button
          className="sidebar-icon-btn"
          title="Notifications (1 Active Warning: FPR Threshold)"
          style={{ position: 'relative' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#f43f5e'
              }}
            />
          )}
        </button>

        {/* Settings */}
        <button className="sidebar-icon-btn" title="Settings">
          <Settings size={20} />
        </button>

        {/* Avatar */}
        <div className="sidebar-avatar" title="ML Scientist Profile">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt="User avatar"
          />
        </div>
      </div>
    </aside>
  );
};
