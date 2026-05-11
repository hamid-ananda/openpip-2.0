import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import type { Protein } from '../../../types/api'

interface InteractorsTableProps {
  proteins: Protein[]
  queryProteinIds: number[]
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <span className="ml-1">↑</span>
  if (isSorted === 'desc') return <span className="ml-1">↓</span>
  return <span className="ml-1 text-gray-300">⇅</span>
}

function buildColumns(queryProteinIds: number[]): ColumnDef<Protein>[] {
  return [
    {
      accessorKey: 'protein_gene_name',
      header: 'Gene Name',
    },
    {
      accessorKey: 'protein_uniprot_id',
      header: 'UniProt ID',
      cell: ({ getValue }) => {
        const id = getValue<string>()
        return (
          <a
            href={`https://www.uniprot.org/uniprot/${id}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {id}
          </a>
        )
      },
    },
    {
      accessorKey: 'protein_ensembl_id',
      header: 'Ensembl ID',
    },
    {
      id: 'type',
      header: 'Type',
      accessorFn: (row) =>
        queryProteinIds.includes(row.protein_id) ? 'Query' : 'Interactor',
      cell: ({ getValue }) => {
        const val = getValue<string>()
        return (
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
              val === 'Query'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {val}
          </span>
        )
      },
    },
    {
      accessorKey: 'number_of_interactions_in_database',
      header: '# Interactions',
      cell: ({ getValue }) => (
        <span className="block text-right">{getValue<number>()}</span>
      ),
    },
  ]
}

export function InteractorsTable({ proteins, queryProteinIds }: InteractorsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = buildColumns(queryProteinIds)

  const table = useReactTable({
    data: proteins,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
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
                No proteins to display.
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
  )
}
