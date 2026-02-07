import Navbar from '@/src/components/Navbar'
import ChatBot from '@/src/components/ChatBot'

export default function ContentLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            {children}
            <ChatBot />
        </>
    )
}
