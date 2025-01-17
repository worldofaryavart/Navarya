// 'use client';

// import React from 'react';
// import { ArrowLeft, Calendar, AlertCircle, Star, Clock, Tag, Briefcase, Users } from 'lucide-react';
// import Link from 'next/link';

// const EmailDashboard = () => {
//   const categories = [
//     {
//       id: 'important',
//       name: 'Important',
//       icon: Star,
//       color: 'bg-yellow-500',
//       count: 12,
//       description: 'High-priority emails requiring immediate attention'
//     },
//     {
//       id: 'urgent',
//       name: 'Urgent Action',
//       icon: AlertCircle,
//       color: 'bg-red-500',
//       count: 5,
//       description: 'Time-sensitive emails needing quick response'
//     },
//     {
//       id: 'calendar',
//       name: 'Calendar Events',
//       icon: Calendar,
//       color: 'bg-blue-500',
//       count: 8,
//       description: 'Meeting invites and event-related emails'
//     },
//     {
//       id: 'followup',
//       name: 'Follow-up',
//       icon: Clock,
//       color: 'bg-purple-500',
//       count: 15,
//       description: 'Emails requiring follow-up or pending responses'
//     },
//     {
//       id: 'work',
//       name: 'Work Projects',
//       icon: Briefcase,
//       color: 'bg-green-500',
//       count: 20,
//       description: 'Project-related and work communication'
//     },
//     {
//       id: 'team',
//       name: 'Team Updates',
//       icon: Users,
//       color: 'bg-indigo-500',
//       count: 10,
//       description: 'Team communications and updates'
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center mb-8">
//           <Link 
//             href="/mailagent"
//             className="flex items-center text-gray-400 hover:text-white transition-colors duration-200 mr-4"
//           >
//             <ArrowLeft size={24} />
//           </Link>
//           <h1 className="text-3xl font-bold">Email Dashboard</h1>
//         </div>

//         {/* Categories Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {categories.map((category) => {
//             const IconComponent = category.icon;
//             return (
//               <div
//                 key={category.id}
//                 className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-all duration-200 cursor-pointer"
//               >
//                 <div className="flex items-start justify-between mb-4">
//                   <div className={`p-3 rounded-lg ${category.color}`}>
//                     <IconComponent size={24} className="text-white" />
//                   </div>
//                   <span className="text-2xl font-bold">{category.count}</span>
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
//                 <p className="text-gray-400 text-sm">{category.description}</p>
//               </div>
//             )
//           })}
//         </div>

//         {/* Quick Stats */}
//         <div className="mt-8 bg-gray-800/30 rounded-lg p-6 border border-gray-700">
//           <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="p-4 bg-gray-800/50 rounded-lg">
//               <div className="text-gray-400 text-sm">Total Emails</div>
//               <div className="text-2xl font-bold">1,234</div>
//             </div>
//             <div className="p-4 bg-gray-800/50 rounded-lg">
//               <div className="text-gray-400 text-sm">Unread</div>
//               <div className="text-2xl font-bold">45</div>
//             </div>
//             <div className="p-4 bg-gray-800/50 rounded-lg">
//               <div className="text-gray-400 text-sm">Action Required</div>
//               <div className="text-2xl font-bold">28</div>
//             </div>
//             <div className="p-4 bg-gray-800/50 rounded-lg">
//               <div className="text-gray-400 text-sm">Archived</div>
//               <div className="text-2xl font-bold">892</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmailDashboard;
