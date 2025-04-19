import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Worker } from "./WorkersTable";
import { EditWorkerModal } from "./EditWorkerModal";
import { useWorkers } from "@/hooks/useWorkers";

export const columns: ColumnDef<Worker>[] = [
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
    accessorKey: "registrationDate",
    header: "Registration Date",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let badgeColor = "secondary";
      if (status === "active") {
        badgeColor = "green";
      } else if (status === "inactive") {
        badgeColor = "yellow";
      } else if (status === "suspended") {
        badgeColor = "red";
      }
      return <Badge variant={badgeColor}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const worker = row.original;
      const [open, setOpen] = useState(false);
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);
      const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
      const { updateWorker } = useWorkers();

      const handleEditWorker = (worker: Worker) => {
        setIsEditModalOpen(true);
      };

      const handleUpdateWorker = async (
        workerId: string,
        updatedWorkerData: Partial<Worker>
      ) => {
        try {
          // Find the existing worker
          const existingWorker = mockWorkers.find((w) => w.id === workerId);

          if (!existingWorker) {
            console.error(`Worker with ID ${workerId} not found.`);
            return;
          }

          // Merge the updated data with the existing worker data
          const updatedWorker = { ...existingWorker, ...updatedWorkerData };

          // Optimistically update the worker in the table
          updateWorker.mutate(updatedWorker as Worker);

          // Close the edit modal
          setIsEditModalOpen(false);
        } catch (error) {
          console.error("Error updating worker:", error);
        }
      };

      const handleDeleteWorker = (worker: Worker) => {
        setWorkerToDelete(worker);
        setOpen(true);
      };

      const confirmDeleteWorker = () => {
        if (workerToDelete) {
          // Delete the worker (replace with your actual delete logic)
          mockWorkers = mockWorkers.filter((w) => w.id !== workerToDelete.id);
          setOpen(false);
        }
      };

      return (
        <>
          <EditWorkerModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            worker={worker}
            onUpdateWorker={handleUpdateWorker}
          />
          <AlertDialog open={open} onOpenChange={setOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEditWorker(worker)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteWorker(worker)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  the worker from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteWorker}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    },
  },
];

// Mock data (replace with your actual data source)
let mockWorkers: Worker[] = [
  {
    id: "1",
    name: "John Doe",
    age: 30,
    phone: "123-456-7890",
    skill: "Construction",
    originState: "California",
    registrationDate: "2023-01-01",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    age: 25,
    phone: "987-654-3210",
    skill: "Plumbing",
    originState: "Texas",
    registrationDate: "2023-02-15",
    status: "inactive",
  },
  {
    id: "3",
    name: "Alice Johnson",
    age: 35,
    phone: "555-123-4567",
    skill: "Electrical",
    originState: "Florida",
    registrationDate: "2023-03-20",
    status: "suspended",
  },
];

export function WorkersTab() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: mockWorkers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting: sorting,
      columnFilters,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter workers..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
