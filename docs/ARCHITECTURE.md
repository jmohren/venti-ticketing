# SQDCI Board Application Architecture

## 🏗️ **Overview**

The SQDCI Board is a React-based manufacturing dashboard application built for tracking Safety, Quality, Delivery, Cost, and Ideas metrics across different production worklines. The application follows a modular, widget-based architecture with clean separation of concerns.

## 📁 **Directory Structure**

```
src/app/
├── ARCHITECTURE.md          # This documentation
├── AppMain.tsx              # Main application component with state provider
├── dialogs/                 # Modal dialogs
│   ├── NewWorkerDialog.tsx
│   └── WorklineSelectionDialog.tsx
├── hooks/                   # Custom React hooks
│   └── useAppActions.tsx    # State action hooks
├── providers/               # React context providers
│   └── AppStateProvider.tsx # Global application state
└── views/                   # Main application views
    ├── analytics/           # Analytics/Auswertung view
    │   ├── AnalyticsView.tsx
    │   └── widgets/         # Individual analytics widgets
    │       ├── SafetyWidget1.tsx    # Accidents with downtime
    │       ├── SafetyWidget2.tsx    # Accidents without downtime
    │       ├── SafetyWidget3.tsx    # Near-miss incidents
    │       ├── QualityWidget1.tsx   # External quality issues
    │       ├── QualityWidget2.tsx   # Downstream quality issues
    │       ├── QualityWidget3.tsx   # QS quality issues
    │       ├── DeliveryWidget1.tsx  # Late orders
    │       ├── DeliveryWidget2.tsx  # Delivery reliability
    │       ├── DeliveryWidget3.tsx  # Delivery performance
    │       ├── IdeasWidget1.tsx     # Order processing ideas
    │       ├── IdeasWidget2.tsx     # Work logistics ideas
    │       └── IdeasWidget3.tsx     # Logistics/maintenance ideas
    └── daily-routine/       # Daily routine view
        ├── DailyRoutineView.tsx
        └── widgets/         # Daily routine widgets
            ├── SafetySQCDPWidget.tsx
            ├── QualitySQCDPWidget.tsx
            ├── DeliverySQCDPWidget.tsx
            ├── IdeasSQCDPWidget.tsx
            └── PDCATableWidget.tsx
```

## 🎯 **Core Architecture Principles**

### **1. Widget-Based Modular Design**
- Each functional unit is encapsulated as a reusable widget
- Widgets are self-contained with their own data fetching and state
- Easy to add, remove, or rearrange widgets without affecting others

### **2. View-Based Organization**
- **Daily Routine View**: Interactive SQDCI widgets for daily team meetings
- **Analytics View**: Historical data visualization and trend analysis
- Each view manages its own layout and widget composition

### **3. Clean Separation of Concerns**
- **App.tsx**: Authentication, routing, session management
- **AppMain.tsx**: Application state management and view routing
- **Views**: Layout and widget orchestration
- **Widgets**: Specific functionality and data presentation

### **4. State Management Pattern**
- Centralized state using React Context (`AppStateProvider`)
- State actions encapsulated in custom hooks (`useAppActions`)
- State is scoped to the application level, not global

## 🔄 **Data Flow Architecture**

```
API Client → Widget → Local State → UI Components
     ↓
Cache Layer (localStorage) → Performance Optimization
     ↓
Error Handling → User Feedback
```

### **Data Fetching Strategy**
- **Individual Widget Responsibility**: Each widget fetches its own data
- **Caching**: 1-hour localStorage cache for expensive API calls
- **Error Isolation**: Widget-level error handling prevents cascade failures
- **Loading States**: Individual widget loading indicators

## 🎨 **UI/UX Design Patterns**

### **Grid-Based Layout System**
- 12-column CSS Grid layout for consistent positioning
- Responsive widget sizing with `columnSpan` and `rowSpan`
- Flexible arrangement without breaking other components

### **Widget Component Pattern**
```tsx
<Widget 
  title="Widget Title"
  gridPosition={{ columnStart: 1, columnSpan: 3, rowStart: 2, rowSpan: 4 }}
  elevation={3}
>
  <WidgetContent />
</Widget>
```

### **Deep Link Pattern**
```tsx
// Generate deep link
const link = generatePDCADeepLink(workline, pdcaId, 'daily-routine');

// Copy to clipboard
await copyPDCALinkToClipboard(workline, pdcaId);
```

### **Consistent Visual Language**
- Material-UI components for consistent styling
- Color-coded categories (Safety: Red, Quality: Blue, etc.)
- Elevation and shadows for depth hierarchy

## 📊 **Analytics Architecture**

### **Widget Categories**
1. **Safety Widgets** (Red theme)
   - Accidents with downtime (real data)
   - Accidents without downtime (placeholder)
   - Near-miss incidents (real data)

2. **Quality Widgets** (Blue theme)
   - External customer quality issues
   - Downstream manufacturing quality
   - QS quality control issues

3. **Delivery Widgets** (Green theme)
   - Late order tracking
   - Delivery reliability metrics
   - Performance indicators

4. **Ideas Widgets** (Purple theme)
   - Order processing improvements
   - Work logistics suggestions
   - Maintenance and logistics ideas

### **Data Integration**
- **Real Data Widgets**: Fetch from SQDI API endpoints
- **Placeholder Widgets**: Ready for implementation with consistent structure
- **Caching Strategy**: Prevents excessive API calls with smart cache invalidation

## 🔧 **Implementation Patterns**

### **Widget Development Pattern**
```tsx
const ExampleWidget: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Data fetching with caching
    // Error handling
    // Loading state management
  }, []);
  
  // Render loading, error, or data states
};
```

### **State Management Pattern**
```tsx
// Provider wraps the application content
const AppMain: React.FC = () => (
  <AppStateProvider>
    <AppMainContent />
  </AppStateProvider>
);

// Components consume state via hooks
const Component = () => {
  const state = useAppState();
  const actions = useAppActions();
};
```

## 🚀 **Extension Guidelines**

### **Adding New Widgets**
1. Create widget component in appropriate category folder
2. Follow the established data fetching and error handling pattern
3. Add to the view's widget composition
4. Update grid positioning as needed

### **Adding New Views**
1. Create view folder under `src/app/views/`
2. Implement view component with widget layout
3. Add view to `AppMain.tsx` routing logic
4. Update `AppStateProvider` available views

### **Adding New Data Sources**
1. Extend API client with new endpoints
2. Implement caching strategy for performance
3. Add error handling for graceful degradation
4. Update relevant widgets to consume new data

## 🔒 **Security & Performance**

### **Authentication Integration**
- Protected routes ensure authenticated access
- Session management handled at application boundary
- User context available throughout the application

### **Performance Optimizations**
- **Lazy Loading**: Components loaded on demand
- **Caching**: Smart cache invalidation prevents unnecessary API calls
- **Error Boundaries**: Prevent widget failures from crashing the app
- **Parallel Data Fetching**: Multiple widgets fetch data simultaneously

## 🧪 **Testing Strategy**

### **Component Testing**
- Individual widget unit tests
- Mock API responses for consistent testing
- Error state and loading state testing

### **Integration Testing**
- View-level component integration
- State management flow testing
- API integration testing

## 📈 **Future Enhancements**

### **Planned Improvements**
- Real-time data updates with WebSocket integration
- Advanced filtering and date range selection
- Export functionality for reports
- Customizable dashboard layouts
- Mobile-responsive optimizations

### **Scalability Considerations**
- Widget lazy loading for large dashboards
- Virtual scrolling for large datasets
- Progressive data loading strategies
- Component-level code splitting

---

## 🎯 **Key Benefits of This Architecture**

✅ **Maintainability**: Clear separation of concerns and modular structure  
✅ **Scalability**: Easy to add new widgets, views, and data sources  
✅ **Performance**: Efficient caching and loading strategies  
✅ **User Experience**: Consistent UI patterns and responsive design  
✅ **Developer Experience**: Clear patterns and easy-to-follow structure  
✅ **Testability**: Isolated components with clear interfaces  

This architecture provides a solid foundation for the SQDCI Board application while remaining flexible enough to accommodate future requirements and enhancements.

## 🔗 **Deep Linking Architecture**

### **URL Structure**
The application supports deep linking via query parameters:
```
/daily-routine?workline=Apparatebau&pdca=3
/analytics?workline=Produktionsleitung&pdca=5
```

### **Query Parameters**
- **`workline`**: Auto-selects workline and skips selection dialog
- **`pdca`**: Auto-opens specific PDCA entry for editing

### **Deep Linking Components**
- **`AppMain.tsx`**: Parses URL parameters and coordinates state
- **`WorklineSelectionDialog.tsx`**: Skips dialog when workline provided
- **`PDCATableWidget.tsx`**: Opens specific entries and provides share functionality
- **`Table.tsx`**: Extended with `openEntryById` prop for programmatic entry opening
- **`deepLinkUtils.ts`**: Utility functions for generating and managing deep links

### **Share Link Functionality**
- **Share Button**: Each PDCA entry has a share icon in the Actions column
- **Clipboard Integration**: Generates and copies shareable URLs
- **User Feedback**: Snackbar notifications for success/error states 