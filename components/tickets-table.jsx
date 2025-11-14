"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Ticket, Mail, Users, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Table components
const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
})
Table.displayName = "Table"

const TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
  return (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
})
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
})
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
})
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(function TableCell({ className, ...props }, ref) {
  return (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
})
TableCell.displayName = "TableCell"

// Type definitions for the analysis data (JSDoc comments for better IDE support)
/**
 * @typedef {Object} AnalysisData
 * @property {string} [ad_name] - Ad name (if available)
 * @property {string} [adset_name] - Adset name (if available)
 * @property {string} [campaign_name] - Campaign name (if available)
 * @property {string} [hash] - Hash value (if available)
 * @property {number} [benchmark_roas] - Benchmark ROAS (if available)
 * @property {number} [roas] - ROAS (if available)
 * @property {number} [total_purchase_value] - Total purchase value (if available)
 * @property {number} [total_spend] - Total spend (if available)
 * @property {number} [total_purchases] - Total purchases (if available)
 * @property {number} [year] - Year (if available)
 * @property {string} [account_name] - Account name (if available)
 * @property {number} [spend] - Spend (if available)
 * @property {number} [impressions] - Impressions (if available)
 * @property {number} [clicks] - Clicks (if available)
 * @property {number} [registrations] - Registrations (if available)
 * @property {number} [ctr] - CTR (if available)
 * @property {number} [cpm] - CPM (if available)
 * @property {number} [cpc] - CPC (if available)
 * @property {number} [cpr] - CPR (if available)
 */

// Creative rendering functions
const renderCreativePreview = (hash, hashData, hashLoading, size, videoPlayer) => {
  const creativeData = hashData[hash];
  const hasMedia = creativeData && creativeData.url;
  const isLoading = hashLoading && !creativeData;
  
  return (
    <Box
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid #D1D5DB',
        background: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {isLoading ? (
        <Spinner size="2" style={{ color: '#888' }} />
      ) : hasMedia ? (
        creativeData.media_type === 'video' ? (
          <video 
            src={creativeData.url} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            muted
            playsInline
            controls={videoPlayer}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.querySelector('.fallback-text').style.display = 'flex';
            }}
          />
        ) : (
          <img 
            src={creativeData.url} 
            alt="Creative" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.querySelector('.fallback-text').style.display = 'flex';
            }}
          />
        )
      ) : null}
      
      {!isLoading && (
        <Text 
          size="1" 
          color="gray" 
          weight="bold"
          className="fallback-text"
          style={{ 
            display: hasMedia ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            fontSize: '8px'
          }}
        >
          {hash ? hash.slice(-4) : ''}
        </Text>
      )}
      
      {/* Video indicator */}
      {hasMedia && creativeData.media_type === 'video' && (
        <Box
          style={{
            position: 'absolute',
            top: '1px',
            right: '1px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: '2px',
            padding: '1px 2px'
          }}
        >
          <Text size="1" style={{ color: 'white', fontSize: '6px' }}>▶</Text>
        </Box>
      )}
    </Box>
  );
};

const renderCreativeFromValue = (value, hashData, hashLoading, size) => {
  if (!value) return <Text size="2" color="gray">-</Text>;
  
  const valueStr = String(value);
  
  // Check if it's a direct URL
  if (valueStr.startsWith('http://') || valueStr.startsWith('https://')) {
    const isVideo = valueStr.toLowerCase().includes('.mp4') || 
                   valueStr.toLowerCase().includes('.mov') || 
                   valueStr.toLowerCase().includes('.webm') ||
                   valueStr.toLowerCase().includes('.avi') ||
                   valueStr.toLowerCase().includes('.mkv');
    
    return (
      <Box
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #D1D5DB',
          background: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {isVideo ? (
          <video 
            src={valueStr} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }}
            muted
            playsInline
          />
        ) : (
          <img 
            src={valueStr} 
            alt="Creative" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 10px;">URL</div>';
            }}
          />
        )}
        
        {/* Video indicator */}
        {isVideo && (
          <Box
            style={{
              position: 'absolute',
              top: '1px',
              right: '1px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '2px',
              padding: '1px 2px'
            }}
          >
            <Text size="1" style={{ color: 'white', fontSize: '6px' }}>▶</Text>
          </Box>
        )}
      </Box>
    );
  }
  
  // Otherwise treat as hash and use hashData
  return renderCreativePreview(valueStr, hashData, hashLoading, size);
};

// Sortable Table Header Component for drag-and-drop
const SortableTableHeader = ({ field, column, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <TableHead ref={setNodeRef} style={style}>
      <div className="flex items-center gap-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {children}
      </div>
    </TableHead>
  );
};

// Function to generate dynamic columns based on data structure
const generateColumns = (data, hashData, hashLoading, selectedListFields = null) => {
  if (!data || data.length === 0) return [];

  const sampleRow = data[0];
  let fields = Object.keys(sampleRow);
  
  // If selectedListFields is provided, use it to order the columns
  if (selectedListFields && Array.isArray(selectedListFields) && selectedListFields.length > 0) {
    
    
    // Filter to only include fields that exist in the data
    const orderedFields = selectedListFields.filter(field => fields.includes(field));
    
    // Add any remaining fields that weren't in selectedListFields
    const remainingFields = fields.filter(field => !selectedListFields.includes(field));
    
    fields = [...orderedFields, ...remainingFields];
    
  }

  return [
    ...fields.map(field => ({
      accessorKey: field,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\bHash\b/g, 'Creative')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const value = row.getValue(field);
        const originalValue = row.original[field];
        
        // Handle different data types
        if (typeof originalValue === 'number') {
          // Check if it's a currency field
          if (field.toLowerCase().includes('spend') || field.toLowerCase().includes('value') || field.toLowerCase().includes('cost')) {
            const formatted = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(originalValue);
            return <div className="text-right font-medium">{formatted}</div>;
          }
          // Check if it's a percentage field
          else if (field.toLowerCase().includes('ctr') || field.toLowerCase().includes('rate')) {
            return <div className="text-right font-medium">{originalValue.toFixed(2)}%</div>;
          }
          // Check if it's a ratio field
          else if (field.toLowerCase().includes('roas') || field.toLowerCase().includes('cpm') || field.toLowerCase().includes('cpc') || field.toLowerCase().includes('cpr')) {
            return <div className="text-right font-medium">{originalValue.toFixed(2)}</div>;
          }
          // Regular number
          else {
            return <div className="text-right font-medium">{originalValue.toLocaleString()}</div>;
          }
        }
        
        // Handle string values
        if (typeof originalValue === 'string') {
          // Check if it's a hash field or URL field that should show creative preview
          if ((field.toLowerCase().includes('hash')  || 
               field.toLowerCase().includes('creative') || field.toLowerCase().includes('url')) &&
              (originalValue.startsWith('http://') || originalValue.startsWith('https://') || 
               hashData[originalValue])) {
            // Use creative rendering function
            return (
              <div className="flex items-center justify-center">
                {renderCreativeFromValue(originalValue, hashData, hashLoading, 40)}
              </div>
            );
          }
          // Regular string
          return (
            <div className="max-w-[200px] truncate" title={originalValue}>
              {originalValue}
            </div>
          );
        }
        
        // Fallback for other types
        return (
          <div className="max-w-[200px] truncate" title={String(originalValue)}>
            {String(originalValue)}
          </div>
        );
      },
    })),
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const rowData = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {Object.keys(rowData).map(key => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => navigator.clipboard.writeText(String(rowData[key]))}
                >
                  Copy {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(rowData, null, 2))
                }}
              >
                Copy Row Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];
};

// Legacy static columns for backward compatibility
export const staticColumns = [
  {
    accessorKey: "ad_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Ad Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium max-w-[200px] truncate" title={row.getValue("ad_name")}>
        {row.getValue("ad_name")}
      </div>
    ),
  },
  {
    accessorKey: "adset_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Adset Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("adset_name")}>
        {row.getValue("adset_name")}
      </div>
    ),
  },
  {
    accessorKey: "campaign_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Campaign Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("campaign_name")}>
        {row.getValue("campaign_name")}
      </div>
    ),
  },
  {
    accessorKey: "hash",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Creative
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm max-w-[120px] truncate" title={row.getValue("hash")}>
        {row.getValue("hash")}
      </div>
    ),
  },
  {
    accessorKey: "benchmark_roas",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Benchmark ROAS
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("benchmark_roas"))
      return (
        <div className="text-right font-medium">
          {value.toFixed(2)}
        </div>
      )
    },
  },
  {
    accessorKey: "roas",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          ROAS
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("roas"))
      const benchmarkRoas = parseFloat(row.original.benchmark_roas)
      const isAboveBenchmark = value > benchmarkRoas
      
      return (
        <div className={`text-right font-medium ${isAboveBenchmark ? 'text-green-600' : 'text-red-600'}`}>
          {value.toFixed(2)}
          {isAboveBenchmark && ' ↗️'}
        </div>
      )
    },
  },
  {
    accessorKey: "total_purchase_value",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Total Purchase Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_purchase_value"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "total_spend",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Total Spend
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_spend"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "total_purchases",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Total Purchases
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = parseInt(row.getValue("total_purchases"))
      return (
        <div className="text-right font-medium">
          {value.toLocaleString()}
        </div>
      )
    },
  },
  {
    accessorKey: "year",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Year
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = parseInt(row.getValue("year"))
      return (
        <div className="text-center font-medium">
          {value}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const analysisData = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(analysisData.hash)}
            >
              Copy Hash
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(analysisData.ad_name)}
            >
              Copy Ad Name
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const data = {
                  ad_name: analysisData.ad_name,
                  adset_name: analysisData.adset_name,
                  campaign_name: analysisData.campaign_name,
                  hash: analysisData.hash,
                  roas: analysisData.roas,
                  benchmark_roas: analysisData.benchmark_roas,
                  total_purchase_value: analysisData.total_purchase_value,
                  total_spend: analysisData.total_spend,
                  total_purchases: analysisData.total_purchases,
                  year: analysisData.year
                }
                navigator.clipboard.writeText(JSON.stringify(data, null, 2))
              }}
            >
              Copy Row Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

/**
 * @typedef {Object} OverviewTableProps
 * @property {Array} data - Array of analysis data objects
 * @property {boolean} isLoading - Loading state
 * @property {string} searchPlaceholder - Placeholder text for search input
 * @property {Object} hashData - Hash data for creative rendering
 * @property {boolean} hashLoading - Loading state for hash data
 * @property {Array} selectedListFields - Array of field names in desired order for list charts
 * @property {Function} onColumnOrderChange - Callback when column order changes
 * @property {string} queryId - Query ID for saving column order
 * @property {string} brandId - Brand ID for API calls
 * @property {string} tableTitle - Title of the table for prefixing selected data
 */
export function OverviewTable({ 
  data, 
  isLoading, 
  searchPlaceholder,
  hashData,
  hashLoading,
  selectedListFields,
  onColumnOrderChange,
  queryId,
  brandId,
  tableTitle = 'Table',
  // Checkbox selection props
  isCheckboxEnabled = false,
  selectedItems = [],
  onSelectionChange,
  onFixSelected,
  onFindCommonPatterns
}) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
    const [columnOrder, setColumnOrder] = React.useState([])
    const [isSaving, setIsSaving] = React.useState(false)
    // Removed drag-related state since card is now positioned at top of table

  // Initialize column order from selectedListFields or data
  React.useEffect(() => {
    if (data && data.length > 0) {
      const fields = Object.keys(data[0]);
      if (selectedListFields && selectedListFields.length > 0) {
        const orderedFields = selectedListFields.filter(field => fields.includes(field));
        const remainingFields = fields.filter(field => !selectedListFields.includes(field));
        setColumnOrder([...orderedFields, ...remainingFields]);
      } else {
        setColumnOrder(fields);
      }
    }
  }, [data, selectedListFields]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-save column order to database (no save button needed)
  const autoSaveColumnOrder = React.useCallback(async (newOrder) => {
    if (!queryId || !brandId) {
      console.error('Missing queryId or brandId for saving column order');
      return;
    }

    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/overall?brand_id=${brandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_id: brandId,
          query_id: queryId,
          selectedListFields: newOrder,
          updateType: 'columnOrder'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        
        
        // Notify parent component (optional callback, doesn't trigger refresh)
        if (onColumnOrderChange) {
          onColumnOrderChange(newOrder);
        }
        
        // ✅ NO GLOBAL REFRESH - Only this table updates locally
        
      } else {
        console.error('❌ Failed to auto-save column order:', result.error);
      }
    } catch (error) {
      console.error('❌ Error auto-saving column order:', error);
    } finally {
      setIsSaving(false);
    }
  }, [queryId, brandId, onColumnOrderChange]);

  // Handle drag end - auto-save immediately
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Auto-save the new order immediately
        autoSaveColumnOrder(newOrder);
        
        return newOrder;
      });
    }
  };

  // Handle row selection
  const handleRowSelection = (rowIndex, isSelected) => {
    if (!onSelectionChange) return;
    
    const itemId = data[rowIndex]?.id || data[rowIndex]?._id || rowIndex;
    let newSelection;
    
    if (isSelected) {
      newSelection = [...selectedItems, itemId];
    } else {
      newSelection = selectedItems.filter(id => id !== itemId);
    }
    
    onSelectionChange(newSelection);
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (!onSelectionChange) return;
    
    if (isSelected) {
      const allItemIds = data.map((item, index) => item.id || item._id || index);
      onSelectionChange(allItemIds);
    } else {
      onSelectionChange([]);
    }
  };

  // Removed drag-related functions since card is now positioned at top of table

  // Generate dynamic columns based on column order
  const columns = React.useMemo(() => {
    const baseColumns = generateColumns(data, hashData, hashLoading, columnOrder);
    
    
    
    // Add checkbox column if enabled
    if (isCheckboxEnabled) {
      const checkboxColumn = {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={selectedItems.length === data.length && data.length > 0}
            onCheckedChange={handleSelectAll}
            size="1"
          />
        ),
        cell: ({ row }) => {
          const itemId = row.original.id || row.original._id || row.index;
          const isSelected = selectedItems.includes(itemId);
          
          return (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleRowSelection(row.index, checked)}
              size="1"
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      };
      
      return [checkboxColumn, ...baseColumns];
    }
    
    return baseColumns;
  }, [data, hashData, hashLoading, columnOrder, isCheckboxEnabled, selectedItems, onSelectionChange])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  // If no data is provided, show empty state
  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No data available</div>
            <div className="text-sm">Data will appear here when available</div>
          </div>
        </div>
      </div>
    )
  }

  // Get selected data for the fix action - return as array of JSON objects with table title
  const getSelectedData = () => {
    const selectedDataArray = data.filter((item, index) => {
      const itemId = item.id || item._id || index;
      return selectedItems.includes(itemId);
    });
    
    
    
    // Return the selected rows as array of JSON objects with table title
    return {
      table_title: tableTitle,
      selected_rows: selectedDataArray
    };
  };

  // Get selected data as array of JSON objects for common patterns analysis
  const getSelectedDataForCommonPatterns = () => {
    const selectedDataArray = data.filter((item, index) => {
      const itemId = item.id || item._id || index;
      return selectedItems.includes(itemId);
    });
    
    // Return the selected rows as array of JSON objects with table title
    return {
      table_title: tableTitle,
      selected_rows: selectedDataArray
    };
  };

  return (
    <div className="w-full">

      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        
        {isSaving && (
          <Flex align="center" gap="2" className="ml-2 text-blue-600">
            <Spinner size="1" />
            <Text size="2" weight="medium">Saving...</Text>
          </Flex>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === "actions" ? "Actions" :
                     column.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\bHash\b/g, 'Creative')}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Draggable Card - Show when items are selected - positioned at top of table */}
      {isCheckboxEnabled && selectedItems.length > 0 && (
        <div className="mb-3">
          <Card 
            className="relative z-10"
            style={{
              userSelect: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Flex align="center" justify="between" gap="2">
              <Flex align="center" justify="center" gap="9">
                
              <Text 
                size="2" 
                weight="medium" 
                color="gray"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  
                  if (onSelectionChange) {
                    onSelectionChange([]);
                  }
                }}
              >
                Clear {selectedItems.length} selected
              </Text>

              <Flex gap="2" align="center">

              {selectedItems.length <= 5 && <RadixButton 
                className="bg-gray-12 cursor-pointer"
                variant="solid"
                size="1"
                onClick={() => {
                  const selectedDataArray = getSelectedData();
                  
                  
                  // Clear selection immediately for instant feedback
                  if (onSelectionChange) {
                    
                    onSelectionChange([]);
                  }
                  
                  if (onFixSelected) {
                    onFixSelected(selectedDataArray);
                  }
                }}
              >
                Fix
              </RadixButton>}

           {selectedItems.length >1 && <RadixButton 
                className="bg-gray-12 cursor-pointer"
                variant="solid"
                size="1"
                onClick={() => {
                  const selectedDataArray = getSelectedDataForCommonPatterns();
                  
                  
                  // Clear selection immediately for instant feedback
                  if (onSelectionChange) {
                    
                    onSelectionChange([]);
                  }
                  
                  if (onFindCommonPatterns) {
                    onFindCommonPatterns(selectedDataArray);
                  }
                }}
              >
                Common Patterns
              </RadixButton>}
              </Flex>
          
                </Flex>
            </Flex>
          </Card>
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => {
                      const isActionsColumn = header.id === "actions";
                      
                      if (isActionsColumn) {
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
                      }
                      
                      return (
                        <SortableTableHeader
                          key={header.id}
                          field={header.column.id}
                          column={header.column}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </SortableTableHeader>
                      );
                    })}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          Showing {table.getFilteredRowModel().rows.length} row(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

// Generate columns for tickets
const generateTicketColumns = () => {
  return [
    {
      accessorKey: "ticketId",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Ticket ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-mono text-sm max-w-[150px] truncate" title={row.getValue("ticketId")}>
          {row.getValue("ticketId")}
        </div>
      ),
    },
    {
      accessorKey: "subject",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Subject
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const subject = row.getValue("subject") || row.original.ticketId
        return (
          <div className="font-medium max-w-[200px] truncate" title={subject}>
            {subject}
          </div>
        )
      },
    },
    {
      accessorKey: "message",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Message
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const message = row.getValue("message")
        return (
          <div className="max-w-[300px] truncate" title={message}>
            {message}
          </div>
        )
      },
    },
    {
      accessorKey: "raisedBy",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Raised By
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const raisedBy = row.getValue("raisedBy")
        const email = raisedBy?.email || "N/A"
        const name = raisedBy?.name || email.split("@")[0]
        return (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-gray-500">{email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "teamName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Team
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const teamName = row.getValue("teamName") || "N/A"
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{teamName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Priority
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const priority = row.getValue("priority")
        const getPriorityColor = (priority) => {
          switch (priority) {
            case 'high':
              return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            case 'medium':
              return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            case 'low':
              return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            default:
              return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
          }
        }
        return (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(priority)}`}>
            {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'N/A'}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue("status")
        const getStatusColor = (status) => {
          switch (status) {
            case 'open':
              return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            case 'in_progress':
              return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            case 'resolved':
              return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            case 'closed':
              return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            default:
              return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
          }
        }
        const getStatusIcon = (status) => {
          switch (status) {
            case 'open':
              return <AlertCircle className="h-3 w-3" />
            case 'in_progress':
              return <Clock className="h-3 w-3" />
            case 'resolved':
            case 'closed':
              return <CheckCircle className="h-3 w-3" />
            default:
              return <Ticket className="h-3 w-3" />
          }
        }
        return (
          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            {status ? status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1) : 'N/A'}
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = row.getValue("createdAt")
        if (!date) return <span className="text-sm text-gray-500">N/A</span>
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{formattedDate}</span>
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const ticket = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(ticket.ticketId)}
              >
                Copy Ticket ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(ticket.raisedBy?.email || '')}
              >
                Copy Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(ticket, null, 2))
                }}
              >
                Copy Row Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export function TicketsTable({ 
  data, 
  isLoading, 
  searchPlaceholder = "Search tickets..."
}) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const columns = React.useMemo(() => generateTicketColumns(), [])

  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <div className="text-lg font-medium mb-2">No tickets available</div>
            <div className="text-sm">Tickets will appear here when created</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === "actions" ? "Actions" :
                     column.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-hidden rounded-md border">
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
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          Showing {table.getFilteredRowModel().rows.length} row(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}