import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { syncOfflineData } from '@/lib/sync'
import { hasOfflineData } from '@/lib/cache'
import toast from 'react-hot-toast'

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const hasData = hasOfflineData()

  const handleSync = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    try {
      await syncOfflineData()
      toast.success('Dados sincronizados com sucesso!')
    } catch (error) {
      console.error('Error syncing data:', error)
      toast.error('Erro ao sincronizar dados')
    } finally {
      setIsSyncing(false)
    }
  }

  if (!hasData) return null

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="fixed bottom-4 right-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg"
    >
      <ArrowPathIcon 
        className={`h-6 w-6 ${isSyncing ? 'animate-spin' : ''}`} 
        aria-hidden="true" 
      />
    </button>
  )
}