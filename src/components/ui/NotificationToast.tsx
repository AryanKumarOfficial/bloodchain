'use client'

import {useAppStore} from '@/lib/store/useAppStore'
import {motion, AnimatePresence} from 'framer-motion'
import {X} from 'lucide-react'

export function NotificationToast() {
    const notifications = useAppStore((state) => state.notifications)


    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notif, index) => (
                    <motion.div
                        key={index} // Ideally use a unique ID
                        initial={{opacity: 0, x: 50}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 50}}
                        className="bg-white dark:bg-slate-800 border-l-4 border-red-500 shadow-lg rounded-md p-4 w-80 pointer-events-auto flex justify-between items-start"
                    >
                        <div>
                            <h4 className="font-bold text-sm">{notif.title || 'Notification'}</h4>
                            <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                        </div>
                        {/* Simple close simulation */}
                        <button className="text-gray-400 hover:text-gray-600">
                            <X size={14}/>
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}