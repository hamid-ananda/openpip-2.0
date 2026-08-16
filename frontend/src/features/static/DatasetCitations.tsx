import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useDatasets } from '../../api/downloads'
import type { DatasetRef } from '../../types/api'
import { referenceHref, referenceLabel, toBibTeX } from '../../lib/citation'

const h3Style: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text)',
  margin: '24px 0 8px',
}

const pStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--text-muted)',
  lineHeight: 1.75,
  margin: '0 0 12px',
}

const citationStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--text)',
  lineHeight: 1.6,
  margin: '0 0 4px',
}

const metaStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--text-soft)',
  lineHeight: 1.6,
}

const linkStyle: CSSProperties = {
  color: 'var(--primary)',
  textDecoration: 'none',
}

function BibTeXButton({ dataset }: { dataset: DatasetRef }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard?.writeText(toBibTeX(dataset))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 4,
        cursor: 'pointer',
        color: 'var(--text-muted)',
        fontSize: 11,
        padding: '2px 8px',
        marginLeft: 8,
      }}
    >
      {copied ? 'Copied' : 'Copy BibTeX'}
    </button>
  )
}

function DatasetCitation({ dataset }: { dataset: DatasetRef }) {
  const href = referenceHref(dataset)
  const heading = dataset.about_heading?.trim() || dataset.name
  const count = Number(dataset.number_of_interactions ?? NaN)

  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={h3Style}>{heading}</h3>

      {dataset.about_body?.trim() && <p style={pStyle}>{dataset.about_body}</p>}

      {dataset.citation ? (
        <div
          style={{
            borderLeft: '2px solid var(--border)',
            paddingLeft: 14,
            margin: '12px 0 0',
          }}
        >
          <p style={citationStyle}>{dataset.citation}</p>
          <div style={metaStyle}>
            {href && (
              <a style={linkStyle} href={href} target="_blank" rel="noopener noreferrer">
                {referenceLabel(dataset)}
              </a>
            )}
            {dataset.publication_status === 'preprint' && <span> · Preprint</span>}
            <BibTeXButton dataset={dataset} />
          </div>
        </div>
      ) : (
        <p style={{ ...metaStyle, fontStyle: 'italic', margin: '8px 0 0' }}>
          Unpublished dataset — please cite openPIP when using it.
        </p>
      )}

      {Number.isFinite(count) && count > 0 && (
        <p style={{ ...metaStyle, margin: '6px 0 0' }}>
          {count.toLocaleString()} interactions
        </p>
      )}
    </div>
  )
}

/**
 * Citations for every dataset in the database.
 *
 * Rendered from the API rather than from site text, so a dataset uploaded by
 * an admin appears here without a code change. The paragraph and the citation
 * are both editable per dataset under Admin → Data.
 */
export function DatasetCitations({ heading, intro }: { heading: string; intro?: string }) {
  const { data: datasets, isLoading } = useDatasets()

  if (isLoading || !datasets?.length) return null

  const visible = datasets
    .filter((ds) => ds.show_on_about !== false)
    .sort((a, b) => (a.about_order ?? 0) - (b.about_order ?? 0) || a.id - b.id)

  if (!visible.length) return null

  return (
    <>
      {heading.trim() && (
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
            color: 'var(--text)',
            margin: '48px 0 16px',
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
          }}
        >
          {heading}
        </h2>
      )}
      {intro?.trim() && <p style={pStyle}>{intro}</p>}
      {visible.map((ds) => (
        <DatasetCitation key={ds.id} dataset={ds} />
      ))}
    </>
  )
}
