import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table as MuiTable, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  TableSortLabel,
  Paper, 
  Box,
  Typography,
  TextField,
  InputAdornment,
  styled,
  IconButton,
  Popover,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import { lighten } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Custom styled component for the triangle indicator
const TriangleIcon = styled('span')<{ open?: boolean }>(({ open }) => ({
  width: 0,
  height: 0,
  display: 'inline-block',
  marginRight: '6px',
  borderLeft: '4px solid transparent',
  borderRight: '4px solid transparent',
  borderTop: open ? 'none' : '6px solid black',
  borderBottom: open ? '6px solid black' : 'none',
  transition: 'transform 0.2s'
}));

// Custom styled TableSortLabel to use our triangle icon
const CustomTableSortLabel = styled(TableSortLabel)(() => ({
  '& .MuiTableSortLabel-icon': {
    display: 'none'
  }
}));

// Enhanced sticky header styling
const StyledTableHead = styled(TableHead)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 2,
  '& .MuiTableCell-root': {
    backgroundColor: theme.palette.grey[50],
    borderBottom: `2px solid ${theme.palette.grey[300]}`,
    fontWeight: 'bold'
  }
}));

// TableCell styled component with hover effect
const StyledTableCell = styled(TableCell)(() => ({
  padding: '6px 12px',
  whiteSpace: 'nowrap'
}));

// Add StyledLabel component after the existing styled components
const StyledLabel = styled(Box)<{ color: string }>(({ color }) => {
  const bgColor = lighten(color, 0.9); // very light variant of the base colour (90% closer to white)
  return {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: 500,
    fontSize: '0.75rem',
    border: `1px solid ${color}`,
    color: color,
    backgroundColor: bgColor,
    textAlign: 'center',
    minWidth: '60px'
  };
});

export type ColumnType = 
  | 'text' 
  | 'text-long'
  | 'number' 
  | 'date' 
  | 'select' 
  | 'boolean' 
  | 'radio' 
  | 'time'
  | 'label'
  | 'custom';

export interface ColumnOption {
  value: string;
  label: string;
  color?: string; // Add color property for label styling
}

export interface TableColumn {
  id: string;
  label: string;
  type?: ColumnType;
  align?: 'left' | 'right' | 'center';
  minWidth?: number;
  format?: (value: any) => string;
  disableSorting?: boolean;
  disableFiltering?: boolean;
  options?: ColumnOption[];
  required?: boolean;
  readOnly?: boolean;
  customRender?: (value: any, onChange: (value: any) => void) => React.ReactNode;
  layoutGroup?: string;
  layoutWidth?: 'full' | 'half';
}

export interface TableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
  title?: string;
  maxHeight?: string | number;
  enablePagination?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  enableSorting?: boolean;
  searchable?: boolean;
  enableFiltering?: boolean;
  enableRowSelection?: boolean;
  enableRowDeletion?: boolean;
  enableRowAddition?: boolean;
  enableRowEditing?: boolean;
  getRowStyle?: (rowData: Record<string, any>) => any;
  onSelectionChange?: (selectedRows: Record<string, any>[]) => void;
  onDeleteRows?: (rowsToDelete: Record<string, any>[]) => void;
  onAddRow?: () => void;
  onEditRow?: (row: Record<string, any>) => void;
  // Server-side search props
  enableServerSideSearch?: boolean;
  onServerSearch?: (searchQuery: string) => void;
  searchLoading?: boolean;
  totalCount?: number;
  onPageChange?: (page: number, rowsPerPage: number) => void;
}

type Order = 'asc' | 'desc';

interface FilterState {
  [columnId: string]: string[];
}

const Table: React.FC<TableProps> = ({ 
  columns, 
  data: initialData, 
  title,
  enablePagination = false,
  rowsPerPageOptions = [50, 75, 100],
  defaultRowsPerPage = 50,
  enableSorting = true,
  searchable = false,
  enableFiltering = true,
  enableRowSelection = true,
  enableRowDeletion = true,
  enableRowAddition = true,
  enableRowEditing = true,
  getRowStyle,
  onSelectionChange,
  onDeleteRows,
  onAddRow,
  onEditRow,
  // Server-side search props
  enableServerSideSearch = false,
  onServerSearch,
  searchLoading = false,
  totalCount,
  onPageChange
}) => {
  
  // Internal data state
  const [data, setData] = useState<Record<string, any>[]>(initialData);
  
  // Update internal data when prop data changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Sorting state
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<Order>('asc');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingSearchQuery, setPendingSearchQuery] = useState(''); // For server-side search input
  const [filteredData, setFilteredData] = useState<Record<string, any>[]>(data);

  // Selection state
  const [selected, setSelected] = useState<Record<string, any>[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({});
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Get unique values for each column for filter dropdowns
  const uniqueColumnValues = useMemo(() => {
    const values: Record<string, Set<string>> = {};
    
    columns.forEach(column => {
      if (!column.disableFiltering) {
        values[column.id] = new Set();
        
        data.forEach(row => {
          const value = row[column.id];
          if (value !== null && value !== undefined) {
            // Use column's format function if available, otherwise convert to string
            const displayValue = column.format 
              ? column.format(value)
              : value instanceof Date 
                ? (isNaN(value.getTime()) ? String(value) : value.toLocaleDateString('de-DE'))
                : String(value);
            values[column.id].add(displayValue);
          }
        });
      }
    });
    
    // Convert sets to sorted arrays
    const result: Record<string, string[]> = {};
    Object.entries(values).forEach(([key, valueSet]) => {
      result[key] = Array.from(valueSet).sort();
    });
    
    return result;
  }, [data, columns]);

  // Update filtered data when search query, column filters, or data changes
  useEffect(() => {
    // Skip client-side filtering if server-side search is enabled
    if (enableServerSideSearch) {
      setFilteredData(data);
      return;
    }
    
    let result = [...data];

    // Apply column-specific filters first
    if (Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([columnId, filterValues]) => {
        if (filterValues.length > 0) {
          result = result.filter(row => {
            const value = row[columnId];
            if (value === null || value === undefined) return false;
            
            // Use the same formatting logic as uniqueColumnValues
            const column = columns.find(col => col.id === columnId);
            const displayValue = column?.format 
              ? column.format(value)
              : value instanceof Date 
                ? (isNaN(value.getTime()) ? String(value) : value.toLocaleDateString('de-DE'))
                : String(value);
            
            return filterValues.includes(displayValue);
          });
        }
      });
    }
    
    // Then apply global search (only for client-side search)
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.trim().toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowerCaseQuery);
        });
      });
    }
    
    setFilteredData(result);
    // Reset to first page when filters change
    setPage(0);
  }, [searchQuery, data, filters, enableServerSideSearch]);

  // Update selected rows if data changes
  useEffect(() => {
    // Filter out selected rows that no longer exist in the data
    const newSelected = selected.filter(selectedRow => 
      data.some(row => JSON.stringify(row) === JSON.stringify(selectedRow))
    );
    
    if (newSelected.length !== selected.length) {
      setSelected(newSelected);
      if (onSelectionChange) {
        onSelectionChange(newSelected);
      }
    }
  }, [data]);

  // Callback for selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selected);
    }
  }, [selected, onSelectionChange]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    if (enableServerSideSearch && onPageChange) {
      onPageChange(newPage, rowsPerPage);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    if (enableServerSideSearch && onPageChange) {
      onPageChange(0, newRowsPerPage);
    }
  };

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (enableServerSideSearch) {
      setPendingSearchQuery(event.target.value);
    } else {
      setSearchQuery(event.target.value);
    }
  };

  // Handle server-side search
  const handleServerSearch = () => {
    if (enableServerSideSearch && onServerSearch) {
      setSearchQuery(pendingSearchQuery);
      onServerSearch(pendingSearchQuery);
      setPage(0); // Reset to first page when searching
    }
  };

  // Handle search key press (Enter to search)
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && enableServerSideSearch) {
      handleServerSearch();
    }
  };

  // Selection handlers
  const isSelected = (row: Record<string, any>) => {
    return selected.some(selectedRow => JSON.stringify(selectedRow) === JSON.stringify(row));
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = displayData;
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleRowClick = (event: React.MouseEvent<unknown>, row: Record<string, any>) => {
    // Only handle checkbox clicks for selection
    if ((event.target as HTMLElement).closest('.MuiCheckbox-root')) {
      const selectedIndex = selected.findIndex(
        selectedRow => JSON.stringify(selectedRow) === JSON.stringify(row)
      );
      let newSelected: Record<string, any>[] = [];

      if (selectedIndex === -1) {
        newSelected = [...selected, row];
      } else {
        newSelected = selected.filter((_, index) => index !== selectedIndex);
      }

      setSelected(newSelected);
    }
  };

  // Filter handlers
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>, columnId: string) => {
    event.stopPropagation(); // Prevent triggering sort
    setFilterAnchorEl(event.currentTarget);
    setActiveFilterColumn(columnId);
    setSelectedFilters(filters[columnId] || []);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterToggle = (value: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const applyFilter = () => {
    if (selectedFilters.length === 0) {
      // If nothing selected, remove the filter
      const newFilters = { ...filters };
      delete newFilters[activeFilterColumn];
      setFilters(newFilters);
    } else {
      // Apply selected filters
      setFilters(prev => ({
        ...prev,
        [activeFilterColumn]: selectedFilters
      }));
    }
    handleFilterClose();
  };

  const clearFilter = () => {
    setSelectedFilters([]);
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[activeFilterColumn];
      return newFilters;
    });
    handleFilterClose();
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const selectAllFilters = () => {
    if (activeFilterColumn && uniqueColumnValues[activeFilterColumn]) {
      setSelectedFilters([...uniqueColumnValues[activeFilterColumn]]);
    }
  };

  const hasFilters = Object.keys(filters).length > 0;

  // Check if a column has an active filter
  const hasColumnFilter = (columnId: string) => {
    return !!filters[columnId] && filters[columnId].length > 0;
  };

  // Sort function
  const sortData = (array: Record<string, any>[], comparator: (a: any, b: any) => number) => {
    const stabilizedThis = array.map((el, index) => [el, index] as [Record<string, any>, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  // Comparator function for sorting
  const getComparator = (order: Order, orderBy: string) => {
    return order === 'desc'
      ? (a: Record<string, any>, b: Record<string, any>) => descendingComparator(a, b, orderBy)
      : (a: Record<string, any>, b: Record<string, any>) => -descendingComparator(a, b, orderBy);
  };

  // Descending comparator
  const descendingComparator = (a: Record<string, any>, b: Record<string, any>, orderBy: string) => {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  };

  // Get the data to display
  const displayData = React.useMemo(() => {
    const sortedData = orderBy && enableSorting
      ? sortData(filteredData, getComparator(order, orderBy))
      : filteredData;
      
    return enablePagination
      ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : sortedData;
  }, [filteredData, order, orderBy, page, rowsPerPage, enablePagination, enableSorting]);
  
  // Calculate number of selected rows on current page
  const numSelected = selected.filter(row => 
    displayData.some(displayRow => JSON.stringify(displayRow) === JSON.stringify(row))
  ).length;
  
  const rowCount = displayData.length;

  // Handle delete action
  const handleDeleteSelected = () => {
    if (selected.length > 0 && onDeleteRows) {
      onDeleteRows(selected);
      setSelected([]);
    }
  };

  // Handle row double click for editing
  const handleRowDoubleClick = (_: React.MouseEvent<unknown>, row: Record<string, any>) => {
    if (enableRowEditing && onEditRow) {
      onEditRow(row);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex',
      flexDirection: 'column'
    }}>
      {title && (
        <Typography 
          variant="h6" 
          sx={{ 
            p: 1, 
            fontWeight: 'medium',
            textAlign: 'center',
            flexShrink: 0 // Prevent shrinking
          }}
        >
          {title}
        </Typography>
      )}
      
      <Box sx={{ 
        px: 1, 
        py: 1, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexShrink: 0 // Prevent shrinking
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {selected.length > 0 && enableRowDeletion && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
              sx={{ height: '40px' }}
            >
              Archivieren {selected.length > 1 ? `(${selected.length})` : ''}
            </Button>
          )}
          
          {enableRowAddition && onAddRow && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              onClick={onAddRow}
              sx={{ height: '40px' }}
            >
              Hinzufügen
            </Button>
          )}
        </Box>
        
        {searchable && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200, ml: 'auto', flexGrow: 1 }}>
            <TextField
              placeholder="Suchen..."
              size="small"
              variant="outlined"
              fullWidth
              value={enableServerSideSearch ? pendingSearchQuery : searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: !enableServerSideSearch && searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {enableServerSideSearch && (
              <Button
                variant="contained"
                size="small"
                onClick={handleServerSearch}
                disabled={searchLoading}
                sx={{ 
                  minWidth: '80px', // Fixed width to prevent layout shift
                  px: 2, 
                  flexShrink: 0,
                  height: '40px' // Match TextField small size height
                }}
              >
                {searchLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  'Suchen'
                )}
              </Button>
            )}
          </Box>
        )}
      </Box>
      
      {hasFilters && (
        <Box sx={{ px: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 1, flexShrink: 0 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Aktive Filter:
          </Typography>
          {Object.entries(filters).map(([columnId, values]) => {
            if (values.length === 0) return null;
            
            const column = columns.find(col => col.id === columnId);
            return column ? (
              <Box 
                key={columnId}
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: 'primary.light',
                  color: 'white',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                  mr: 1,
                  mb: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                {column.label}: {values.length === 1 ? values[0] : `${values.length} ausgewählt`}
                <IconButton 
                  size="small" 
                  sx={{ ml: 0.5, p: 0.2, color: 'white' }}
                  onClick={() => {
                    setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters[columnId];
                      return newFilters;
                    });
                  }}
                >
                  <ClearIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Box>
            ) : null;
          })}
          <Button 
            size="small" 
            variant="text" 
            onClick={clearAllFilters}
            sx={{ ml: 'auto', fontSize: '0.75rem' }}
          >
            Alle löschen
          </Button>
        </Box>
      )}
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          flex: 1, // Take up all available space
          minHeight: 0, // Allow shrinking
          overflow: 'auto',
          boxShadow: 'none',
          border: 'none',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.3)',
            }
          }
        }}
      >
        <MuiTable stickyHeader aria-label="sticky table" size="small">
          <StyledTableHead>
            <TableRow>
              {enableRowSelection && (
                <StyledTableCell padding="checkbox">
                  <Checkbox
                    indeterminate={numSelected > 0 && numSelected < rowCount}
                    checked={rowCount > 0 && numSelected === rowCount}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'Alle auswählen' }}
                    size="small"
                  />
                </StyledTableCell>
              )}
              {columns.map((column) => (
                <StyledTableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    position: 'relative'
                  }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      {enableSorting && !column.disableSorting ? (
                        <CustomTableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleSort(column.id)}
                          sx={{
                            color: 'black !important',
                            '&:hover': {
                              color: 'black !important'
                            },
                            '&.Mui-active': {
                              color: 'black !important'
                            }
                          }}
                        >
                          {orderBy === column.id && (
                            <TriangleIcon open={order === 'asc'} />
                          )}
                          {column.label}
                        </CustomTableSortLabel>
                      ) : (
                        column.label
                      )}
                    </Box>
                    
                    {enableFiltering && !column.disableFiltering && (
                      <IconButton 
                        size="small"
                        onClick={(e) => handleFilterClick(e, column.id)}
                        color={hasColumnFilter(column.id) ? "primary" : "default"}
                        sx={{ 
                          p: 0.5, 
                          ml: 0.5,
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } 
                        }}
                      >
                        <FilterListIcon 
                          fontSize="small" 
                          sx={{ fontSize: '1.2rem' }}
                        />
                      </IconButton>
                    )}
                  </Box>
                </StyledTableCell>
              ))}
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {displayData.map((row, index) => {
              const isItemSelected = isSelected(row);
              const customStyle = getRowStyle ? getRowStyle(row) : {};
              
              return (
                <TableRow 
                  hover 
                  tabIndex={-1} 
                  key={index}
                  selected={isItemSelected}
                  onClick={(event) => handleRowClick(event, row)}
                  onDoubleClick={(event) => handleRowDoubleClick(event, row)}
                  sx={{ 
                    cursor: enableRowEditing ? 'pointer' : 'default',
                    '&:hover': enableRowEditing ? {
                      backgroundColor: 'rgba(0, 0, 0, 0.04) !important'
                    } : {},
                    ...customStyle
                  }}
                >
                  {enableRowSelection && (
                    <StyledTableCell padding="checkbox">
                      <Checkbox
                        checked={isItemSelected}
                        size="small"
                        className="MuiCheckbox-root"
                      />
                    </StyledTableCell>
                  )}
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <StyledTableCell key={column.id} align={column.align || 'left'}>
                        {column.type === 'custom' && column.customRender ? (
                          column.customRender(row, () => {}) // Pass entire row data for custom rendering
                        ) : column.type === 'label' && value ? (
                          (() => {
                            const option = column.options?.find(opt => opt.value === value);
                            return option ? (
                              <StyledLabel color={option.color || '#666666'}>
                                {option.label}
                              </StyledLabel>
                            ) : value;
                          })()
                        ) : column.format ? column.format(value) : (
                          value instanceof Date ? (
                            isNaN(value.getTime()) ? String(value) : value.toLocaleDateString('de-DE')
                          ) : value
                        )}
                      </StyledTableCell>
                    );
                  })}
                </TableRow>
              );
            })}
            {displayData.length === 0 && (
              <TableRow>
                <StyledTableCell colSpan={enableRowSelection ? columns.length + 1 : columns.length} align="center">
                  {searchQuery.trim() || hasFilters ? 'Keine Treffer' : 'Keine Daten verfügbar'}
                </StyledTableCell>
              </TableRow>
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>
      
      {enablePagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={enableServerSideSearch ? (totalCount || 0) : filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Zeilen pro Seite:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}–${to} von ${count !== -1 ? count : `mehr als ${to}`}`
          }
          sx={{ 
            borderTop: '1px solid rgba(224, 224, 224, 1)',
            flexShrink: 0, // Prevent shrinking
            mt: 'auto', // Push to bottom if needed
            '.MuiTablePagination-toolbar': {
              minHeight: '52px',
            },
          }}
        />
      )}

      {/* Filter Popover */}
      <Popover
        open={!!filterAnchorEl}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filtern nach {columns.find(col => col.id === activeFilterColumn)?.label}
          </Typography>
          
          <TextField
            placeholder="Werte suchen..."
            size="small"
            fullWidth
            variant="outlined"
            sx={{ mb: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ 
            maxHeight: 200, 
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            mb: 2
          }}>
            <List dense disablePadding>
              {activeFilterColumn && uniqueColumnValues[activeFilterColumn] ? (
                uniqueColumnValues[activeFilterColumn].map((value) => {
                  const column = columns.find(col => col.id === activeFilterColumn);
                  // Decide how to render the label/value inside the filter list
                  const renderedLabel = (column?.type === 'label' && column.options) ? (() => {
                    const option = column.options.find(opt => opt.value === value);
                    return option ? (
                      <StyledLabel color={option.color || '#666666'}>
                        {option.label}
                      </StyledLabel>
                    ) : (
                      <Typography variant="body2">{value}</Typography>
                    );
                  })() : (
                    <Typography variant="body2">{value}</Typography>
                  );

                  return (
                    <ListItem 
                      key={value} 
                      dense 
                      disablePadding
                      sx={{ 
                        py: 0,
                        borderBottom: '1px solid #f0f0f0',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={selectedFilters.includes(value)}
                            onChange={() => handleFilterToggle(value)}
                            size="small"
                          />
                        }
                        label={renderedLabel}
                        sx={{ width: '100%', ml: 0, px: 1 }}
                      />
                    </ListItem>
                  );
                })
              ) : (
                <ListItem>
                  <ListItemText primary="Keine Werte verfügbar" />
                </ListItem>
              )}
            </List>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Button 
              variant="text" 
              size="small" 
              onClick={selectAllFilters}
            >
              Alle auswählen
            </Button>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => setSelectedFilters([])}
            >
              Leeren
            </Button>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={clearFilter}
            >
              Zurücksetzen
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              onClick={applyFilter}
              disabled={selectedFilters.length === 0 && !filters[activeFilterColumn]}
            >
              Anwenden
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default Table; 