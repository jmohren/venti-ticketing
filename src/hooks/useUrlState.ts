import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

// Generic hook for any URL parameter
export const useUrlParam = <T>(
  key: string,
  defaultValue?: T,
  serializer?: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  }
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read value from URL
  const value = useMemo(() => {
    const urlValue = searchParams.get(key);
    if (!urlValue) return defaultValue || null;
    
    if (serializer) {
      try {
        return serializer.deserialize(urlValue);
      } catch (error) {
        console.warn(`Failed to deserialize URL parameter "${key}":`, error);
        return defaultValue || null;
      }
    }
    
    return urlValue as T;
  }, [searchParams, key, defaultValue, serializer]);
  
  // Write value to URL
  const setValue = useCallback((newValue: T | null) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (newValue === null || newValue === undefined) {
      newParams.delete(key);
    } else {
      try {
        const serializedValue = serializer 
          ? serializer.serialize(newValue)
          : String(newValue);
        newParams.set(key, serializedValue);
      } catch (error) {
        console.warn(`Failed to serialize URL parameter "${key}":`, error);
        return;
      }
    }
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, key, serializer]);
  
  return [value, setValue] as const;
};

// Built-in serializers for common types
export const urlSerializers = {
  string: {
    serialize: (value: string) => value,
    deserialize: (value: string) => value
  },
  number: {
    serialize: (value: number) => String(value),
    deserialize: (value: string) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
      return num;
    }
  },
  boolean: {
    serialize: (value: boolean) => value ? 'true' : 'false',
    deserialize: (value: string) => value === 'true'
  },
  object: {
    serialize: (value: any) => JSON.stringify(value),
    deserialize: (value: string) => JSON.parse(value)
  },
  array: {
    serialize: (value: any[]) => JSON.stringify(value),
    deserialize: (value: string) => {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error(`Expected array, got: ${typeof parsed}`);
      return parsed;
    }
  }
};

// Convenience hooks for common patterns
export const useStringParam = (key: string, defaultValue?: string) => 
  useUrlParam(key, defaultValue, urlSerializers.string);

export const useNumberParam = (key: string, defaultValue?: number) => 
  useUrlParam(key, defaultValue, urlSerializers.number);

export const useBooleanParam = (key: string, defaultValue?: boolean) => 
  useUrlParam(key, defaultValue, urlSerializers.boolean);

export const useObjectParam = <T>(key: string, defaultValue?: T) => 
  useUrlParam(key, defaultValue, urlSerializers.object);

export const useArrayParam = <T>(key: string, defaultValue?: T[]) => 
  useUrlParam(key, defaultValue, urlSerializers.array);

// Navigation helper that preserves all URL params
export const useUrlAwareNavigation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const navigateWithParams = useCallback((path: string) => {
    const params = searchParams.toString();
    const fullPath = params ? `${path}?${params}` : path;
    navigate(fullPath);
  }, [searchParams, navigate]);
  
  const navigateWithoutParams = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);
  
  return { 
    navigateWithParams, 
    navigateWithoutParams,
    currentParams: searchParams.toString()
  };
};

// Utility to get multiple URL parameters at once
export const useUrlParams = (keys: string[]) => {
  const [searchParams] = useSearchParams();
  
  return useMemo(() => {
    const params: Record<string, string | null> = {};
    keys.forEach(key => {
      params[key] = searchParams.get(key);
    });
    return params;
  }, [searchParams, keys]);
};

// Utility to update multiple URL parameters at once
export const useUrlBatchUpdate = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const updateParams = useCallback((updates: Record<string, string | number | boolean | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  return { updateParams };
};

// Legacy compatibility - keep existing interface for backward compatibility
export interface UrlState {
  workline: string | null;
  pdca: number | null;
  view: string | null;
  filter: string | null;
  search: string | null;
}

export const useUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse URL into structured state (read-only)
  const urlState = useMemo((): UrlState => ({
    workline: searchParams.get('workline'),
    pdca: searchParams.get('pdca') ? parseInt(searchParams.get('pdca')!, 10) : null,
    view: searchParams.get('view'),
    filter: searchParams.get('filter'),
    search: searchParams.get('search')
  }), [searchParams]);
  
  // Update URL (batched updates, single source of truth)
  const updateUrl = useCallback((updates: Partial<UrlState>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  // Clear specific URL parameter
  const clearUrlParameter = useCallback((paramName: keyof UrlState) => {
    updateUrl({ [paramName]: null });
  }, [updateUrl]);
  
  return { 
    urlState, 
    updateUrl, 
    clearUrlParameter
  };
}; 