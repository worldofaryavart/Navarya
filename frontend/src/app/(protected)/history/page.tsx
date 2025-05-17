const ConversationHistory  = () => {
    return (
        // {showHistory ? (
        //   isLoadingHistory ? (
        //     <div className="flex items-center justify-center h-full">
        //       <Loader2 size={32} className="animate-spin text-purple-500" />
        //     </div>
        //   ) : conversations.length === 0 ? (
        //     <div className="text-center text-gray-400 mt-8">No conversations found.</div>
        //   ) : (
        //     <>
        //       <div className="space-y-3">
        //         {conversations.map((conv) => (
        //           <div
        //             key={conv.id}
        //             onClick={() => handleConversationSelect(conv.id)}
        //             className={`bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors ${
        //               conv.active ? "ring-2 ring-purple-500" : ""
        //             }`}
        //           >
        //             <div className="flex items-center justify-between mb-2">
        //               <div className="flex items-center space-x-2">
        //                 <Clock size={16} className="text-gray-400 flex-shrink-0" />
        //                 <span className="text-sm text-gray-400">
        //                   {new Date(conv.createdAt).toLocaleDateString()} - {new Date(conv.createdAt).toLocaleTimeString()}
        //                 </span>
        //               </div>
        //               {conv.active && (
        //                 <span className="px-2 py-0.5 bg-purple-900/70 text-purple-300 text-xs rounded-full">Active</span>
        //               )}
        //             </div>
        //             <p className="text-gray-300 text-sm line-clamp-2">{conv.firstMessage || "No messages in this conversation."}</p>
        //             <p className="text-xs text-gray-500 mt-1">{conv.messageCount || 0} messages</p>
        //           </div>
        //         ))}
        //       </div>
        //       {hasMoreConversations && (
        //         <div className="flex justify-center mt-4">
        //           <button
        //             onClick={loadMoreConversations}
        //             disabled={isLoadingMore}
        //             className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
        //           >
        //             {isLoadingMore ? (
        //               <>
        //                 <Loader2 size={16} className="animate-spin" />
        //                 <span>Loading...</span>
        //               </>
        //             ) : (
        //               <span>Show More</span>
        //             )}
        //           </button>
        //         </div>
        //       )}
        //     </>
        //   )
        // ) 
        <p>yes this is conversation history</p>
    );
}