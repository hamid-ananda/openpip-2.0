import { useSearchStore } from '../searchStore'
import { LoadingOverlay } from './LoadingOverlay'
import { DownloadModal } from './DownloadModal'
import { CyRestModal } from './CyRestModal'
import { DirectDownloadModal } from './DirectDownloadModal'

export function OverlaySystem() {
  const { activeModal, setModal } = useSearchStore()
  const close = () => setModal(null)

  if (activeModal === 'loading') return <LoadingOverlay />
  if (activeModal === 'download') return <DownloadModal onClose={close} />
  if (activeModal === 'cyRest') return <CyRestModal onClose={close} />
  if (activeModal === 'directDownload') return <DirectDownloadModal onClose={close} />
  return null
}
