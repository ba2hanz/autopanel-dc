import React from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  action,
  actionTooltip
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 1 }}
      >
        <Link
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <Link
            key={index}
            component={RouterLink}
            to={crumb.to}
            color="inherit"
            sx={{
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {crumb.label}
          </Link>
        ))}
        <Typography color="text.primary">{title}</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {action && (
          <Tooltip title={actionTooltip}>
            <IconButton
              color="primary"
              onClick={action.onClick}
              size="large"
            >
              {action.icon}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
} 