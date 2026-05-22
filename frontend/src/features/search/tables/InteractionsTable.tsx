import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import type { Interaction, Protein } from '../../../types/api'

interface InteractionsTableProps {
  interactions: Interaction[]
  proteins: Protein[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Published: 'var(--hi-union)',
  Validated: 'var(--huri-lit)',
  Verified: 'var(--danger)',
  Literature: 'var(--literature)',
  Mixed: 'var(--accent)',
}

function CategoryBadge({ status }: { status: string }) {
  const color = CATEGORY_COLORS[status] ?? 'var(--text-muted)'
  return (
    <span style={{
      display: 'inline-block',
      borderRadius: 4,
      padding: '1px 7px',
      fontSize: 11,
      fontWeight: 600,
      background: 'var(--surface-2)',
      color,
      border: '1px solid var(--border)',
    }}>
      {status}
    </span>
  )
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <span style={{ marginLeft: 4 }}>↑</span>
  if (isSorted === 'desc') return <span style={{ marginLeft: 4 }}>↓</span>
  return <span style={{ marginLeft: 4, color: 'var(--border-strong)' }}>⇅</span>
}

const columns: ColumnDef<Interaction>[] = [
  {
    accessorFn: (row) => row.interactor_A.protein_gene_name,
    id: 'interactorA',
    header: 'Interactor A',
  },
  {
    accessorFn: (row) => row.interactor_B.protein_gene_name,
    id: 'interactorB',
    header: 'Interactor B',
  },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: ({ getValue }) => {
      const val = getValue<number | null>()
      return (
        <span style={{ display: 'block', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12 }}>
          {val?.toFixed(2) ?? '—'}
        </span>
      )
    },
  },
  {
    accessorFn: (row) => row.interaction_category_array.highest_category_status,
    id: 'category',
    header: 'Category',
    cell: ({ getValue }) => <CategoryBadge status={getValue<string>()} />,
  },
  {
    accessorFn: (row) => row.dataset_array.map((d) => d.name).join(', '),
    id: 'datasets',
    header: 'Datasets',
  },
]

const TH_BASE: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  color: 'var(--text-muted)',
  userSelect: 'none',
  background: 'var(--surface-2)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

export function InteractionsTable({ interactions }: InteractionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: interactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = interactions.length
  const pageCount = table.getPageCount()
  const currentPage = pageIndex + 1

  return (
    <div style={{ background: 'var(--bg)' }}>
      <div style={{ overflowX: 'auto', background: 'var(--bg)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'var(--bg)' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ ...TH_BASE, cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    onMouseEnter={(e) => { if (header.column.getCanSort()) e.currentTarget.style.background = 'var(--border)' }}
                    onMouseLeave={(e) => { if (header.column.getCanSort()) e.currentTarget.style.background = 'var(--surface-2)' }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon isSorted={header.column.getIsSorted()} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ background: 'var(--bg)' }}>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}
                >
                  No interactions to display.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: '8px 16px', color: 'var(--text)' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
          <span>
            {totalRows} interaction{totalRows !== 1 ? 's' : ''} — page {currentPage} of {pageCount} ({pageSize} per page)
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="op-btn"
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              Previous
            </button>
            <span style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 12 }}>
              {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="op-btn"
              style={{ fontSize: 12, padding: '5px 12px' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
