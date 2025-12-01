import {create} from 'zustand'
import {devtools} from 'zustand/middleware'
import {io, Socket} from 'socket.io-client'

interface AppState {
    socket: Socket | null
    isConnected: boolean
    notifications: any[]

    connectSocket: (userId: string, token: string) => void
    disconnectSocket: () => void
    addNotification: (notification: any) => void
    clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
    devtools(
        (set, get) => ({
            socket: null,
            isConnected: false,
            notifications: [],

            connectSocket: (userId, token) => {
                const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

                // Prevent multiple connections
                if (get().socket?.connected) return

                const socket = io(socketUrl, {
                    auth: {userId, token},
                    transports: ['websocket'],
                })

                socket.on('connect', () => {
                    console.log('✅ Socket connected')
                    set({isConnected: true})
                })

                socket.on('disconnect', () => {
                    console.log('❌ Socket disconnected')
                    set({isConnected: false})
                })

                socket.on('notification', (data) => {
                    get().addNotification(data)
                })

                set({socket})
            },

            disconnectSocket: () => {
                get().socket?.disconnect()
                set({socket: null, isConnected: false})
            },

            addNotification: (notification) => {
                set((state) => ({
                    notifications: [notification, ...state.notifications]
                }))
            },

            clearNotifications: () => set({notifications: []}),
        }),
        {enabled: process.env.NODE_ENV === "development", name: "AppStore"}
    )
)
