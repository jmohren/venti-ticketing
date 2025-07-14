import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Typography, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { LogoutOutlined, PersonOutline } from '@mui/icons-material';
import { WidgetContainer } from '@/core/components/WidgetContainer';
import { User } from '@/core/api/auth/AuthApiClient';

interface NavigatorBarProps {
  user?: User;
  onLogout?: () => void;
  currentView?: string;
  onViewChange?: (event: React.MouseEvent<HTMLElement>, newView: string | null) => void;
  availableViews?: Array<{ value: string; label: string }>;
  useStyledToggle?: boolean;
  gridPosition?: {
    columnStart?: number | string;
    columnSpan?: number;
    rowStart?: number | string;
    rowSpan?: number;
  };
}

const NavigatorBar: React.FC<NavigatorBarProps> = ({
  user,
  onLogout,
  currentView = 'daily-routine',
  onViewChange,
  availableViews = [{ value: 'daily-routine', label: 'Daily Routine' }],
  useStyledToggle = true,
  gridPosition = { columnStart: 1, columnSpan: 12, rowStart: 1, rowSpan: 1 },
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout?.();
  };

  // Get display name with fallback
  const displayName = user?.profile?.firstName || user?.email?.split('@')[0] || 'User';

  const toggleButtonStyles = useStyledToggle ? {
    border: 'none',
    '& .MuiToggleButton-root': {
      border: 'none',
      borderRadius: 0,
      position: 'relative',
      color: 'text.secondary',
      backgroundColor: 'transparent',
      fontWeight: 500,
      fontSize: (theme: any) => theme.typography.h6.fontSize,
      textTransform: 'none',
      paddingLeft: 0,
      paddingRight: 0,
      marginLeft: 1,
      marginRight: 1,
      marginBottom: 0,
      outline: 'none',
      '&:hover': {
        backgroundColor: 'transparent',
        color: 'primary.main',
      },
      '&:active': {
        backgroundColor: 'transparent',
      },
      '&:focus': {
        backgroundColor: 'transparent',
        outline: 'none',
      },
      '&.Mui-selected': {
        backgroundColor: 'transparent',
        color: 'primary.main',
        fontWeight: 500,
        outline: 'none',
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: 'primary.main',
          borderRadius: '1.5px 1.5px 0 0',
        },
        '&:hover': {
          backgroundColor: 'transparent',
          color: 'primary.main',
        },
        '&:active': {
          backgroundColor: 'transparent',
        },
        '&:focus': {
          backgroundColor: 'transparent',
          outline: 'none',
        },
      },
    },
  } : {};

  return (
    <WidgetContainer gridPosition={gridPosition}>
      <Box sx={{ 
        width: '100%',
        height: '100%',
        '& > div': {
          padding: '16px 24px',
          height: '100%',
          boxSizing: 'border-box'
        }
      }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          {/* Left side - View Toggle Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={currentView}
              exclusive
              onChange={onViewChange}
              aria-label="View selection"
              sx={toggleButtonStyles}
            >
              {availableViews.map((view) => (
                <ToggleButton key={view.value} value={view.value} disableRipple={useStyledToggle}>
                  {view.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Right side - User info and logout */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Welcome, {displayName}!
              </Typography>
              
              <IconButton
                onClick={handleClick}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <PersonOutline fontSize="small" />
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleClose} disabled>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PersonOutline fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {user.profile?.firstName && user.profile?.lastName 
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : displayName
                      }
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutOutlined fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Box>
    </WidgetContainer>
  );
};

export { NavigatorBar }; 