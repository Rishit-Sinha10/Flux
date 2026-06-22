import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/auth_context'
export default function ProtectedRoute({ children }) {
	// 🔑 PRIMARY: Use Clerk's auth state (fast, reliable)
	const { isLoaded, isSignedIn } = useAuth()
	// 📊 SECONDARY: Use auth_context for profile status (non-blocking)
	// Note: profileLoaded, profileError, profileLoading are now separate from authentication
	const { profileLoaded, profileError, profileLoading, retryProfileFetch } = useAppContext()	
	// 🔍 Debug logging
	useEffect(() => {
		console.log('[ProtectedRoute] State:', {
			isLoaded,
			isSignedIn,
			profileLoaded,
			profileError: profileError ? `${profileError}` : null,
			profileLoading
		})
	}, [isLoaded, isSignedIn, profileLoaded, profileError, profileLoading])
	// ⏳ STEP 1: Clerk is still loading authentication
	if (!isLoaded) {
		console.log('[ProtectedRoute] Clerk still loading...')
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-4"></div>
					<p className="text-white text-lg font-medium">Loading authentication...</p>
					<p className="text-white/60 text-sm mt-2">Verifying with Clerk</p>
				</div>
			</div>
		)
	}
	// ❌ STEP 2: User NOT signed in with Clerk
	if (!isSignedIn) {
		console.log('[ProtectedRoute] User not signed in, redirecting to login')
		return <Navigate to="/login" replace />
	}
	// ✅ STEP 3: User IS signed in with Clerk
	// ✨ NEW: Render dashboard immediately while profile loads in background
	console.log('[ProtectedRoute] ✅ User signed in with Clerk, rendering dashboard')
	
	return (
		<div>
			{/* MAIN CONTENT: Render dashboard immediately */}
			{children}
			
			{/* PROFILE STATUS INDICATOR: Top-right corner */}
			{profileLoading && (
				<div className="fixed top-4 right-4 bg-blue-600/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
					<div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
					<span className="text-sm font-medium">Loading your profile...</span>
				</div>
			)}
			{/* PROFILE ERROR: Show if profile fetch failed */}
			{profileError && !profileLoading && (
				<div className="fixed top-4 right-4 bg-red-600/80 text-white px-4 py-3 rounded-lg max-w-xs shadow-lg">
					<div className="flex items-start gap-3">
						<span className="text-lg">⚠️</span>
						<div className="flex-1">
							<p className="text-sm font-medium">Profile Load Error</p>
							<p className="text-xs mt-1 opacity-90">{profileError}</p>
							<button
								onClick={retryProfileFetch}
								className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
							>
								Retry
							</button>
						</div>
					</div>
				</div>
			)}			
			{/* SUCCESS: Profile loaded */}
			{profileLoaded && !profileError && !profileLoading && (
				<div className="fixed top-4 right-4 bg-green-600/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg animate-fade-out">
					<span className="text-lg">✅</span>
					<span className="text-sm font-medium">Profile loaded</span>
				</div>
			)}
		</div>
	)
}