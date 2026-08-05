import { NavLink } from 'react-router-dom';
import { 
  Cloud, 
  Home, 
  Folder, 
  Clock, 
  Star, 
  Trash2, 
  Settings, 
  Activity, 
  HardDrive
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Folder, label: 'All Files', path: '/files' },
    { icon: Clock, label: 'Recent', path: '/recent' },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: HardDrive, label: 'Connected Drives', path: '/drives' },
    { icon: Activity, label: 'Analytics', path: '/analytics' },
    { icon: Trash2, label: 'Trash', path: '/trash' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center h-16 border-b border-[var(--sidebar-border)] px-6">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Cloud className="w-5 h-5" />
            </div>
            <span>MyCloudHub</span>
          </div>
        </div>

        <div className="px-4 py-6 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] custom-scrollbar">
          <div className="mb-4 px-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</h3>
          </div>
          
          {navItems.slice(0, 6).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm group relative",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-6 mt-6 mb-4 px-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</h3>
          </div>

          {[navItems[6], { icon: Settings, label: 'Settings', path: '/settings' }].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 font-medium text-sm group relative",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
          
          <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-1">Upgrade to Pro</h4>
            <p className="text-xs text-muted-foreground mb-3">Get unlimited drives and priority support.</p>
            <button className="w-full py-2 bg-foreground text-background text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
