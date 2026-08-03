import { useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { ProteinListRow } from '../../api/proteins'
import { useProtein } from '../../api/proteins'
import { useText } from '../../text'
import { ProteinDetailPanel } from './ProteinDetailPanel'
import { ProteinListSidebar } from './ProteinListSidebar'

const STYLES = `
  .pp-shell {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    height: calc(100vh - var(--chrome-height, 128px));
    min-height: 520px;
  }
  .pp-detail { overflow-y: auto; min-width: 0; }
  @media (max-width: 820px) {
    .pp-shell { grid-template-columns: 1fr; height: auto; }
    .pp-shell > :first-child { height: 60vh; }
  }
`

function CentredMessage({ title, body }: { title: string; body?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 320,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      {body && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 420 }}>
          {body}
        </p>
      )}
    </div>
  )
}

export function ProteinsPage() {
  const t = useText()
  const navigate = useNavigate()
  const { identifier = '' } = useParams<{ identifier: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  // Both the selection and the query live in the URL, so any view of this page
  // can be copied out of the address bar and shared.
  const query = searchParams.get('q') ?? ''

  const setQuery = useCallback(
    (next: string) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current)
          if (next) params.set('q', next)
          else params.delete('q')
          return params
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const selectIdentifier = useCallback(
    (next: string) => {
      const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
      navigate(`/proteins/${encodeURIComponent(next)}${suffix}`)
    },
    [navigate, query]
  )

  const onSelectRow = useCallback(
    (row: ProteinListRow) => selectIdentifier(row.protein_gene_name || row.protein_uniprot_id),
    [selectIdentifier]
  )

  const { data: protein, isLoading, isError } = useProtein(identifier)

  return (
    <>
      <style>{STYLES}</style>
      <div className="pp-shell">
        <ProteinListSidebar
          query={query}
          onQueryChange={setQuery}
          selectedIdentifier={identifier}
          onSelect={onSelectRow}
        />

        <div className="pp-detail" role="region" aria-label={t('proteins.detailLabel')}>
          {!identifier ? (
            <CentredMessage title={t('proteins.emptyTitle')} body={t('proteins.emptyBody')} />
          ) : isLoading ? (
            <CentredMessage title={t('proteins.detailLoading')} />
          ) : isError || !protein ? (
            <CentredMessage
              title={t('proteins.notFoundTitle')}
              body={t('proteins.notFoundBody', { identifier })}
            />
          ) : (
            <ProteinDetailPanel protein={protein} onSelectInteractor={selectIdentifier} />
          )}
        </div>
      </div>
    </>
  )
}
