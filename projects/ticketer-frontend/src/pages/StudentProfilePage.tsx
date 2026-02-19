import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import { useAuth } from '../context/AuthContext'
import { StudentProfile } from '../components/home/StudentProfile'

export default function StudentProfilePage() {
  const navigate = useNavigate()
  const { wallets } = useWallet()
  const { clearRole } = useAuth()

  const onBack = () => navigate('/student-home')
  const onSignOut = async () => {
    const activeWallet = wallets?.find((w) => w.isActive)
    if (activeWallet) await activeWallet.disconnect()
    clearRole()
    navigate('/landing-v2', { replace: true })
  }

  return <StudentProfile onBack={onBack} onSignOut={onSignOut} />
}
