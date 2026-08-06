import { Outlet } from 'react-router-dom';

// TEMPORARY: Login/signup disabled for maintenance.
// The auth check is bypassed here so the app is directly accessible
// without logging in. To re-enable login later, replace this file's
// contents with the original version below:
//
// import { Navigate, Outlet } from 'react-router-dom';
// import { useAuthStore } from '../../store/authStore';
// import { Cloud } from 'lucide-react';
// import { motion } from 'motion/react';
//
// export function ProtectedRoute() {
//   const { isAuthenticated, isLoading } = useAuthStore();
//
//   if (isLoading) {
//     return (
//       <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
//         <motion.div
//           animate={{ scale: [1, 1.1, 1] }}
//           transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
//           className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg mb-4"
//         >
//           <Cloud className="w-8 h-8" />
//         </motion.div>
//         <p className="text-muted-foreground font-medium animate-pulse">Authenticating...</p>
//       </div>
//     );
//   }
//
//   return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
// }

export function ProtectedRoute() {
  return <Outlet />;
}
