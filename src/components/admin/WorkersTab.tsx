import { Worker } from "./WorkersTable";
import { useWorkers, WorkerWithAadhaar } from "@/hooks/useWorkers";
import { DataTable } from "@/components/ui/data-table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { WorkerDetailsDialog } from "./WorkerDetailsDialog";

interface WorkersTabProps {
  onViewDetails: (worker: Worker) => void;
}

export function WorkersTab({ onViewDetails }: WorkersTabProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithAadhaar | null>(null);

  const { workers, isLoadingWorkers, updateWorker } = useWorkers();

  const columns: ColumnDef<WorkerWithAadhaar>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "age",
      header: "Age",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "skill",
      header: "Skill",
    },
    {
      accessorKey: "originState",
      header: "Origin State",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const worker = row.original;
        return (
          <select
            className="border rounded px-2 py-1"
            value={worker.status}
            onChange={(e) => {
              const newStatus = e.target.value as "active" | "inactive" | "pending";
              updateWorkerStatus(worker, newStatus);
            }}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button onClick={() => {
          onViewDetails(row.original);
        }}>
          View Details
        </Button>
      )
    }
  ];

  const table = useReactTable({
    data: workers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getPaginationModel: getPaginationModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleViewDetails = (worker: WorkerWithAadhaar) => {
    setSelectedWorker(worker);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedWorker(null);
  };

  const updateWorkerStatus = (worker: WorkerWithAadhaar, status: "active" | "inactive" | "pending") => {
    const updatedWorker = { ...worker, status };
    updateWorker.mutate(updatedWorker);
  };

  return (
    <div>
      <DataTable table={table} />
      {selectedWorker && (
        <WorkerDetailsDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          worker={selectedWorker}
        />
      )}
    </div>
  );
}
