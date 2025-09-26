// app/offline/page.tsx
export default function OfflinePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-800">You’re offline</h1>
                <p className="mt-2 text-gray-600">
                    Don’t worry, UniVault works offline too. Some features may be limited
                    until you reconnect.
                </p>
            </div>
        </div>
    );
}
