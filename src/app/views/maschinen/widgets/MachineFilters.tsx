import React from 'react';
import {
  Box,
  TextField,
  Chip,
  InputAdornment,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  ListItemText,
  Checkbox,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { MachineFilters as MachineFiltersType, MachineFilterOptions } from '@/app/state/MachineProvider';

interface Props {
  filters: MachineFiltersType;
  filterOptions: MachineFilterOptions | null;
  filterOptionsLoading: boolean;
  onFiltersChange: (filters: MachineFiltersType) => void;
  onSearch: () => void;
  loading?: boolean;
}

const MachineFilters: React.FC<Props> = ({ filters, filterOptions, filterOptionsLoading, onFiltersChange, onSearch, loading = false }) => {
  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters };
    if (value.trim()) {
      newFilters.search = value.trim();
    } else {
      delete newFilters.search;
    }
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (field: keyof MachineFiltersType, values: string[]) => {
    const newFilters = { ...filters };
    if (values.length > 0) {
      newFilters[field] = values as any;
    } else {
      delete newFilters[field];
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof MachineFiltersType];
    return Array.isArray(value) ? value.length > 0 : !!value;
  }).length;

  if (!filterOptions) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Filter werden geladen..."
            disabled
            sx={{ minWidth: 300, flex: 1 }}
          />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Suche nach Name oder Nummer..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        {/* Location Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Standort</InputLabel>
          <Select
            multiple
            value={filters.locations || []}
            onChange={(e) => handleMultiSelectChange('locations', e.target.value as string[])}
            input={<OutlinedInput label="Standort" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            disabled={loading || filterOptionsLoading}
          >
            {filterOptions.locations.map((location) => (
              <MenuItem key={location} value={location}>
                <Checkbox checked={(filters.locations || []).indexOf(location) > -1} />
                <ListItemText primary={location} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Work Station Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Arbeitsplatz</InputLabel>
          <Select
            multiple
            value={filters.work_stations || []}
            onChange={(e) => handleMultiSelectChange('work_stations', e.target.value as string[])}
            input={<OutlinedInput label="Arbeitsplatz" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            disabled={loading || filterOptionsLoading}
          >
            {filterOptions.work_stations.map((workStation) => (
              <MenuItem key={workStation} value={workStation}>
                <Checkbox checked={(filters.work_stations || []).indexOf(workStation) > -1} />
                <ListItemText primary={workStation} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Manufacturer Filter */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Hersteller</InputLabel>
          <Select
            multiple
            value={filters.manufacturers || []}
            onChange={(e) => handleMultiSelectChange('manufacturers', e.target.value as string[])}
            input={<OutlinedInput label="Hersteller" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            disabled={loading || filterOptionsLoading}
          >
            {filterOptions.manufacturers.map((manufacturer) => (
              <MenuItem key={manufacturer} value={manufacturer}>
                <Checkbox checked={(filters.manufacturers || []).indexOf(manufacturer) > -1} />
                <ListItemText primary={manufacturer} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* ABC Classification Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>ABC-Klasse</InputLabel>
          <Select
            multiple
            value={filters.abc_classifications || []}
            onChange={(e) => handleMultiSelectChange('abc_classifications', e.target.value as string[])}
            input={<OutlinedInput label="ABC-Klasse" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            disabled={loading || filterOptionsLoading}
          >
            {filterOptions.abc_classifications.map((classification) => (
              <MenuItem key={classification} value={classification}>
                <Checkbox checked={(filters.abc_classifications || []).indexOf(classification) > -1} />
                <ListItemText primary={classification} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Equipment Type Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Typ</InputLabel>
          <Select
            multiple
            value={filters.equipment_types || []}
            onChange={(e) => handleMultiSelectChange('equipment_types', e.target.value as string[])}
            input={<OutlinedInput label="Typ" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
            disabled={loading || filterOptionsLoading}
          >
            {filterOptions.equipment_types.map((type) => (
              <MenuItem key={type} value={type}>
                <Checkbox checked={(filters.equipment_types || []).indexOf(type) > -1} />
                <ListItemText primary={type} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Search Button */}
        <Button
          variant="contained"
          onClick={onSearch}
          disabled={loading || filterOptionsLoading}
          startIcon={<SearchIcon />}
          sx={{ minWidth: 100 }}
        >
          Suchen
        </Button>

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <Chip
            label={`${activeFilterCount} Filter aktiv`}
            onDelete={clearAllFilters}
            deleteIcon={<ClearIcon />}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
      </Box>
    </Paper>
  );
};

export default MachineFilters;
