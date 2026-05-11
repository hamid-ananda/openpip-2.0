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
  Published: 'bg-blue-100 text-blue-800',
  Validated: 'bg-green-100 text-green-800',
  Verified: 'bg-purple-100 text-purple-800',
  Literature: 'bg-red-100 text-red-800',
  Mixed: 'bg-pink-100 text-pink-800',
}

function CategoryBadge({ status }: { status: string }) {
  const colorClass = CATEGORY_COLORS[status] ?? 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  )
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <span className="ml-1">↑</span>
  if (isSorted === 'desc') return <span className="ml-1">↓</span>
  return <span className="ml-1 text-gray-300">⇅</span>
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
        <span className="block text-right">{val?.toFixed(2) ?? '—'}</span>
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
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 select-none ${
                      header.column.getCanSort() ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <SortIcon isSorted={header.column.getIsSorted()} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-400">
                  No interactions to display.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-gray-800">
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
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            {totalRows} interaction{totalRows !== 1 ? 's' : ''} — showing page {currentPage} of{' '}
            {pageCount} ({pageSize} per page)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="px-2 py-1">
              Page {currentPage} of {pageCount}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
