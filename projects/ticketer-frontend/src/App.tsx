import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProfileLoader from './components/ProfileLoader'
import { ProtectedRoute } from './components/ProtectedRoute'
import LandingPageV2 from './pages/LandingPageV2'
import OrganizerDashboard from './pages/OrganizerDashboard'
import StudentTickets from './pages/StudentTickets'
import MyTickets from './pages/MyTickets'
import GateVerifier from './pages/GateVerifier'
import VerifyTicketPage from './pages/VerifyTicketPage'
import StudentHome from './pages/StudentHome'
import StudentProfilePage from './pages/StudentProfilePage'
import { EventPage } from './components/home/EventPage'
import { GroupedEventsPage } from './components/home/GroupedEventsPage'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      // Keep false so wallet connection persists across refresh; true can clear session on load
      resetNetwork: false,
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <AuthProvider>
          <BrowserRouter>
            <ProfileLoader />
            <Routes>
              <Route path="/" element={<LandingPageV2 />} />
              <Route
                path="/organizer"
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-home"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:eventId"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <EventPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/group"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <GroupedEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tickets"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verify"
                element={
                  <ProtectedRoute allowedRoles={['gate']}>
                    <GateVerifier />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/verify-ticket"
                element={
                  <ProtectedRoute allowedRoles={['gate']}>
                    <VerifyTicketPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </WalletProvider>
    </SnackbarProvider>
  )
}
