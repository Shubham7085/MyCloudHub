import { Outlet } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { motion } from 'motion/react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Premium Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md mb-8 flex flex-col items-center"
      >
        <div className="bg-blue-600 p-2.5 rounded-2xl text-white mb-4 shadow-lg">
          <Cloud className="w-8 h-8" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          MyCloudHub
        </h2>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="sm:mx-auto sm:w-full sm:max-w-[440px]"
      >
        <div className="bg-card/80 backdrop-blur-xl py-10 px-6 sm:px-10 shadow-glass border border-border/60 rounded-3xl mx-4 sm:mx-0">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
