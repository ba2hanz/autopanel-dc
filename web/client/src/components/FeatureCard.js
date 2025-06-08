import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Info as InfoIcon,
  Star as StarIcon
} from '@mui/icons-material';

export default function FeatureCard({
  title,
  description,
  icon: Icon,
  usage,
  limit,
  premium = false,
  tooltip
}) {
  const percentage = (usage / limit) * 100;
  const isLimited = usage >= limit;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {premium && (
        <Box
          sx={{
            position: 'absolute',
            top: -12,
            right: -12,
            zIndex: 1
          }}
        >
          <Tooltip title="Premium Feature">
            <IconButton
              size="small"
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              <StarIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'white',
              mr: 2
            }}
          >
            <Icon />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            {tooltip && (
              <Tooltip title={tooltip}>
                <InfoIcon
                  fontSize="small"
                  sx={{ color: 'text.secondary', ml: 1 }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Usage
            </Typography>
            <Typography
              variant="body2"
              color={isLimited ? 'error' : 'text.secondary'}
            >
              {usage} / {limit}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percentage}
            color={isLimited ? 'error' : 'primary'}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'action.hover'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
} 